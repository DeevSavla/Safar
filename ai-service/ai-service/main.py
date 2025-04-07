from fastapi import FastAPI, Request, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from google import genai
from google.genai import types
from dotenv import load_dotenv
import os
import json
import re
from typing import Dict, List, Optional
import requests
from pydantic import BaseModel
from datetime import datetime, timedelta
import base64
from geopy.geocoders import Nominatim

def get_coords(location):
    """Returns (latitude, longitude) for given location name."""
    try:
        geolocator = Nominatim(user_agent="geocoding-app")
        location_data = geolocator.geocode(location)
        return (location_data.latitude, location_data.longitude) if location_data else None
    except Exception as e:
        print(f"Error: {e}")
        return None

def get_historical_weather(latitude, longitude, date):
    """
    Fetches historical weather data for given coordinates and date.
    Uses the same date from the previous year if current year's data is not available.
    
    Args:
        latitude (float): Location latitude
        longitude (float): Location longitude
        date (str): Date in format 'YYYY-MM-DD'
        
    Returns:
        dict: Weather data for the specified date
    """
    base_url = "https://archive-api.open-meteo.com/v1/archive"
    
    # Try current year first
    params = {
        "latitude": latitude,
        "longitude": longitude,
        "start_date": date,
        "end_date": date,
        "daily": "temperature_2m_max,temperature_2m_min,temperature_2m_mean,daylight_duration,rain_sum,snowfall_sum",
        "timezone": "auto"
    }
    
    try:
        response = requests.get(base_url, params=params)
        response.raise_for_status()
        data = response.json()
        
        # If no data for current year, try previous year
        if not data.get("daily", {}).get("time"):
            prev_year = str(int(date[:4]) - 1)
            prev_date = prev_year + date[4:]
            params["start_date"] = prev_date
            params["end_date"] = prev_date
            response = requests.get(base_url, params=params)
            response.raise_for_status()
            data = response.json()
            
        return data
    except requests.exceptions.RequestException as e:
        print(f"Error fetching weather data: {e}")
        return None

def format_weather_data(weather_data):
    """Format weather data for display"""
    if not weather_data or "daily" not in weather_data:
        return "No weather data available"
    
    daily = weather_data["daily"]
    dates = daily["time"]
    max_temps = daily["temperature_2m_max"]
    min_temps = daily["temperature_2m_min"]
    precipitation = daily["precipitation_sum"]
    
    result = []
    result.append(f"Weather data for {weather_data.get('timezone', 'Unknown timezone')}")
    
    for i in range(len(dates)):
        result.append(f"Date: {dates[i]}, Max: {max_temps[i]}°C, Min: {min_temps[i]}°C, Precipitation: {precipitation[i]}mm")
    
    return "\n".join(result)

class WeatherRequest(BaseModel):
    location: str
    days: int


load_dotenv()
API_KEY = os.getenv("GEMINI_KEY")
GOOGLE_PLACES_API_KEY = os.getenv("GOOGLE_PLACES_API_KEY")

client = genai.Client(api_key=API_KEY)
app = FastAPI(
    title="Travel Planner AI Service",
    description="AI-powered service for travel planning and itinerary generation",
    version="1.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Store chat sessions in memory (in production, use a database)
chat_sessions: Dict[str, List[Dict[str, str]]] = {}

class PlaceDetails(BaseModel):
    name: str
    type: str  # "accommodation" or "restaurant"
    city: str
    country: str

class TransportationRequest(BaseModel):
    source: str
    destination: str
    date: str
    type: str  # "flight", "train", or "bus"

@app.post("/api/places/details")
async def get_place_details(place: PlaceDetails):
    """
    Fetch details for a place (accommodation or restaurant) using Google Places API
    """
    try:
        # First, search for the place
        search_url = f"https://maps.googleapis.com/maps/api/place/textsearch/json"
        search_params = {
            "query": f"{place.name} {place.city} {place.country}",
            "key": GOOGLE_PLACES_API_KEY
        }
        
        search_response = requests.get(search_url, params=search_params)
        search_data = search_response.json()
        
        if not search_data.get("results"):
            return {"error": "Place not found"}
        
        place_id = search_data["results"][0]["place_id"]
        
        # Get detailed information about the place
        details_url = f"https://maps.googleapis.com/maps/api/place/details/json"
        details_params = {
            "place_id": place_id,
            "fields": "name,formatted_address,geometry,photos,website,rating,reviews,opening_hours",
            "key": GOOGLE_PLACES_API_KEY
        }
        
        details_response = requests.get(details_url, params=details_params)
        details_data = details_response.json()
        
        if not details_data.get("result"):
            return {"error": "Could not fetch place details"}
        
        result = details_data["result"]
        
        # Get photo URLs
        photos = []
        if "photos" in result:
            for photo in result["photos"][:3]:  # Get first 3 photos
                photo_url = f"https://maps.googleapis.com/maps/api/place/photo"
                photo_params = {
                    "maxwidth": 400,
                    "photo_reference": photo["photo_reference"],
                    "key": GOOGLE_PLACES_API_KEY
                }
                photos.append(requests.get(photo_url, params=photo_params).url)
        
        # Get Google Maps link
        maps_link = f"https://www.google.com/maps/place/?q=place_id:{place_id}"
        
        return {
            "name": result.get("name"),
            "address": result.get("formatted_address"),
            "rating": result.get("rating"),
            "photos": photos,
            "maps_link": maps_link,
            "website": result.get("website"),
            "opening_hours": result.get("opening_hours", {}).get("weekday_text", []),
            "reviews": result.get("reviews", [])[:3]  # Get first 3 reviews
        }
        
    except Exception as e:
        return {"error": str(e)}

@app.get("/")
async def root():
    return {"message": "Travel Planner AI Service is running"}

@app.post("/api/ai/generate-itinerary")
async def generate_itinerary(request: Request):
    data = await request.json()

    source = data.get("source")
    destination = data.get("destination")
    activities = data.get("activities_to_attend")
    date_range = data.get("date_range")
    budget = data.get("budget")
    number_of_people = data.get("numberofpeople")

    # Get weather data for the destination
    coords = get_coords(destination)
    weather_data = None
    if coords:
        # Get weather for the first day of the trip
        start_date = date_range[0] if isinstance(date_range, list) else date_range
        weather_data = get_historical_weather(coords[0], coords[1], start_date)

    system_instruction = """
        Generate a detailed, structured, and strictly valid JSON itinerary based on the input details provided below.
        How to write:
        - Along with the accomodations and restaurants also give their price range.
        - In events section look for festivals or functions on that day in nearby area and fit the itinerary according to these events(for example republic day on 26-1 at redfort in delhi).
        - for transportation add all the modes of transportation possible for that day and that area. and mention how they will be linked with each other to reach the destination
        - make sure the estimated travel duration is taken into account to schedule the activities of the day if the transportation takes the whole day then make sure that no activities are scheduled for that day.
        - the extra suggestions should also include some common known fraudulent activities and places to avoid along with places to not miss.
        - Consider the weather conditions when planning activities and suggesting appropriate events to attend.
        
        INPUT PARAMETERS:
        - destination: [string] – Main destination of the trip.
        - path: [list of strings] – Specific places or areas to cover in the trip.
        - activities_to_attend: [list of strings] – Desired activities.
        - trip_length: [integer] – Number of days for the trip.
        - date_range: [start_date, end_date] – Date range for the trip.
        - budget: [string] – Total budget for the entire trip.
        - accomodations: [list of preferences] – Hotel or stay preferences.
        - restaurants: [list of preferences] – Preferred cuisines or restaurant types.
        - numberofpeople: [integer] – Number of travelers.
        - weather_data: [object] – Weather information for the destination.        
        RESPONSE FORMAT RULES:
        - Output only valid JSON (do not wrap with triple backticks or Markdown).
        - The root structure must have:
        - "day_wise_plan": an array of objects, one for each day.
        - "additional_suggestions": an object with extra recommendations.

        Each object inside "day_wise_plan" must have:
        {
            "day": "1",
            "date": "DD-MM-YYYY",
            "destination": "Specific places for this day",
            "activities": ["Activity 1", "Activity 2"],
            "accomodations": ["Hotel 1"],
            "restaurants": ["Restaurant 1"],
            "events": ["Event 1", "Event 2"],       #festivals or functions on that day in that area
            "transportation": [{
                "transportation_route1": [{
                    "transportation_mode1": "Transportation mode",
                    "transportation_duration1": "Transportation duration",
                    "transportation_distance1": "Transportation distance",
                    "transportation_link1": "Transportation link",
                    "estimated_cost1": "Approximate cost in currency"
                },
                {
                    "transportation_mode2": "Transportation mode",
                    "transportation_duration2": "Transportation duration",
                    "transportation_distance2": "Transportation distance",
                    "transportation_link2": "Transportation link",
                    "estimated_cost2": "Approximate cost in currency"
                }
                ],
                "transportation_route2": [{
                    "transportation_mode1": "Transportation mode",
                    "transportation_duration1": "Transportation duration",
                    "transportation_distance1": "Transportation distance",
                    "transportation_link1": "Transportation link",
                    "estimated_cost1": "Approximate cost in currency"
                },
                {
                    "transportation_mode2": "Transportation mode",
                    "transportation_duration2": "Transportation duration",
                    "transportation_distance2": "Transportation distance",
                    "transportation_link2": "Transportation link",
                    "estimated_cost2": "Approximate cost in currency"
                }],
            }],
            "estimated_cost": "Approximate cost in currency",
        }

        "additional_suggestions" format:
        {
            "events": ["Event 1", "Event 2"],
            "restaurants": ["Restaurant 1", "Restaurant 2"],
            "accomodations": ["Accommodation 1", "Accommodation 2"],
            "transportation": ["Tip 1", "Tip 2"],
            "weather_tips": ["Tip 1", "Tip 2"]
        }


        STRICT RULES:
        - Do NOT include markdown formatting like ```json.
        - Make sure the output is valid JSON ONLY.
        - Use the provided structure exactly.
        - Dates must fall within the given date_range.
        - Ensure recommendations are realistic for the destination and budget.
        - Consider weather conditions when planning activities and suggesting gear.

        BEGIN.
        """

    user_prompt = system_instruction + "\n" + f"Source: {source}\nDestination: {destination}\nActivities to attend: {activities}\nDate range: {date_range}\nBudget: {budget}\nNumber of people: {number_of_people}"
    
    if weather_data and "daily" in weather_data:
        daily = weather_data["daily"]
        weather_info = f"""
        Weather Information:
        - Mean Temperature: {daily['temperature_2m_mean'][0]}°C
        - Max Temperature: {daily['temperature_2m_max'][0]}°C
        - Min Temperature: {daily['temperature_2m_min'][0]}°C
        - Daylight Duration: {daily['daylight_duration'][0]} hours
        - Rain: {daily['rain_sum'][0]}mm
        - Snowfall: {daily['snowfall_sum'][0]}mm
        """
        user_prompt += "\n" + weather_info

    response = client.models.generate_content(
        model="gemini-2.0-flash",
        contents=user_prompt,
    )
    response = {"message": "Itinerary generated successfully", "itinerary": response.text}
    return clean_and_parse_itinerary_response(response)

@app.post("/api/ai/edit-itinerary")
async def edit_itinerary(request: Request):
    data = await request.json()
    
    session_id = data.get("session_id")
    current_itinerary = data.get("current_itinerary")
    user_message = data.get("message")
    
    if session_id not in chat_sessions:
        chat_sessions[session_id] = []
    
    chat_sessions[session_id].append({"role": "user", "content": user_message})
    
    system_instruction = """
    You are a travel itinerary editor AI. Your task is to modify the existing itinerary based on the user's request.
    The current itinerary is provided in JSON format. You must:
    1. Understand the user's request
    2. Make the necessary modifications to the itinerary
    3. Return the updated itinerary in the same JSON format
    4. Ensure all changes maintain the original structure and data types
    5. Keep dates within the original date range
    6. Ensure all modifications are realistic and feasible
    Current itinerary:
    """
    
    prompt = system_instruction + json.dumps(current_itinerary) + "\n\nUser request: " + user_message
    
    response = client.models.generate_content(
        model="gemini-2.0-flash",
        contents=prompt,
    )
    
    chat_sessions[session_id].append({"role": "assistant", "content": response.text})
    
    try:
        updated_itinerary = clean_and_parse_itinerary_response({
            "message": "Itinerary updated successfully",
            "itinerary": response.text
        })
        return updated_itinerary
    except json.JSONDecodeError:
        return {
            "error": "Failed to parse the updated itinerary",
            "message": "Please try again with a different modification request"
        }

def clean_and_parse_itinerary_response(response):
    raw_str = response["itinerary"]
    clean_str = re.sub(r"```json|```", "", raw_str).strip()
    
    itinerary_json = json.loads(clean_str)
    
    response["itinerary"] = itinerary_json
    return response

@app.post("/api/transportation/costs")
async def get_transportation_costs(request: TransportationRequest):
    """
    Estimate transportation costs using Gemini AI with dedicated context
    """
    try:
        # Prepare the system instruction for cost estimation
        system_instruction = """
        You are a transportation cost estimation AI. Your task is to provide realistic cost estimates for various modes of transportation in India.
        Consider the following factors:
        1. Distance between source and destination
        2. Type of transportation (flight/train/bus)
        3. Time of travel (peak/off-peak)
        4. Current market rates
        5. Different classes/options available
        
        Provide estimates strictly in the following format:
        {
            "estimates": [
                {
                    "type": "transportation_type",
                    "options": [
                        {
                            "name": "option_name",
                            "duration": "estimated_duration",
                            "price_range": {
                                "min": "minimum_price",
                                "max": "maximum_price"
                            },
                            "description": "brief_description",
                            "booking_platforms": ["platform1", "platform2"]
                        }
                    ]
                }
            ]
        }
        
        Current request details:
        """
        
        prompt = system_instruction + f"""
        Source: {request.source}
        Destination: {request.destination}
        Date: {request.date}
        Type: {request.type}
        
        Please provide cost estimates for this journey.
        """
        
        response = client.models.generate_content(
            model="gemini-2.0-flash",
            contents=prompt,
        )
        response = clean_and_parse_itinerary_response({
            "message": "Itinerary updated successfully",
            "itinerary": response.text
        })
        try:
            return {
                "source": request.source,
                "destination": request.destination,
                "date": request.date,
                "type": request.type,
                "estimates": response
            }
        except json.JSONDecodeError:
            return {
                "error": "Failed to parse cost estimates",
                "message": "Please try again with different parameters"
            }
        
    except Exception as e:
        return {"error": str(e)}

@app.post("/api/ai/legal-docs")
async def generate_legal_docs(request: Request):
    data = await request.json()
    source = data.get("source")
    destination = data.get("destination")
    
    system_instruction = """
    You are a travel legal documents advisor AI. Your task is to provide a list of required legal documents for travel.
    Based on the source and destination, determine if it's a domestic or international trip and provide appropriate document requirements.
    
    Consider the following factors:
    1. Source and destination countries
    2. Special requirements based on destination
    3. Common travel document requirements
    
    Provide the response in the following JSON format:
    {
        "trip_info": {
            "type": "domestic/international",
        },
        "documents": [
            {
                "document_type": "document_name",
                "mandatory": true/false,
            }
        ],
        "additional_requirements": [
            {
                "requirement": "requirement_name",
            }
        ]
    }
    Current request details:
    """
    
    prompt = system_instruction + f"""
    Source: {source}
    Destination: {destination}
    
    Please provide the required legal documents and additional requirements.
    """
    
    response = client.models.generate_content(
        model="gemini-2.0-flash",
        contents=prompt,
    )
    
    try:
        # Clean and parse the response
        clean_str = re.sub(r"```json|```", "", response.text).strip()
        documents_json = json.loads(clean_str)
        
        return {
            "message": "Legal documents generated successfully",
            "documents": documents_json
        }
    except json.JSONDecodeError:
        return {
            "error": "Failed to parse legal documents",
            "message": "Please try again with different parameters"
        }

@app.post("/api/ai/describe-image")
async def describe_image(file: UploadFile = File(...)):
    """
    Analyze an image and generate a positive description
    """
    try:
        contents = await file.read()
        
        image_base64 = base64.b64encode(contents).decode('utf-8')
        
        system_instruction = """
        You are an image analysis AI that focuses on finding and describing the positive aspects of any image.
        Your task is to:
        1. Analyze the image carefully
        2. Identify key elements and features
        3. Generate a brief, positive description
        4. Focus on uplifting and optimistic aspects
        5. Keep the description concise but meaningful
        
        Provide the response in the following JSON format:
        {
            "description": "positive_description",
            "key_elements": ["element1", "element2"],
            "mood": "positive_mood_description"
        }
        """
        
        prompt = [
            system_instruction,
            types.Image.from_bytes(contents)
        ]
        
        response = client.models.generate_content(
            model="gemini-pro-vision",
            contents=prompt,
        )
        
        try:
            clean_str = re.sub(r"```json|```", "", response.text).strip()
            description_json = json.loads(clean_str)
            
            return {
                "message": "Image analyzed successfully",
                "analysis": description_json
            }
        except json.JSONDecodeError:
            return {
                "message": "Image analyzed successfully",
                "description": response.text
            }
            
    except Exception as e:
        return {"error": str(e)}

@app.post("/api/weather/historical")
async def get_historical_weather_data(request: WeatherRequest):
    """
    Get historical weather data for a location
    """
    try:
        # Get coordinates
        coords = get_coords(request.location)
        if not coords:
            return {
                "error": f"Could not find coordinates for {request.location}",
                "message": "Please check the location name and try again"
            }
        
        # Validate and limit days
        days = max(1, min(30, request.days))  # Limit to 1-30 days
        
        # Calculate date range
        end_date = datetime.now().date()
        start_date = end_date - timedelta(days=days-1)
        
        # Get weather data
        weather = get_historical_weather(
            coords[0], 
            coords[1], 
            start_date.strftime("%Y-%m-%d")
        )
        
        if not weather:
            return {
                "error": "Failed to fetch weather data",
                "message": "Please try again later"
            }
        
        # Format the response
        daily = weather["daily"]
        formatted_data = {
            "location": request.location,
            "timezone": weather.get("timezone", "Unknown"),
            "period": {
                "start_date": start_date.strftime("%Y-%m-%d"),
                "end_date": end_date.strftime("%Y-%m-%d")
            },
            "daily_data": [
                {
                    "date": daily["time"][i],
                    "max_temperature": daily["temperature_2m_max"][i],
                    "min_temperature": daily["temperature_2m_min"][i],
                    "precipitation": daily["precipitation_sum"][i]
                }
                for i in range(len(daily["time"]))
            ]
        }
        
        return {
            "message": "Weather data retrieved successfully",
            "data": formatted_data
        }
        
    except Exception as e:
        return {"error": str(e)}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000) 