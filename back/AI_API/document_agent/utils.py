from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph
from datetime import datetime
from langchain_core.tools import tool
from datetime import datetime
from langgraph.prebuilt import create_react_agent
from langchain_openai import ChatOpenAI
import re
from pymongo import MongoClient

from openai import OpenAI
from decouple import config


DB_LINK = config("DB_LINK")

client = MongoClient(DB_LINK)
db = client["devfest"]


api_key = config("CODE_CORTEX")
def analyze_bandwidth_data(data, api_key):
    """
    Use OpenAI to analyze the bandwidth 'want' and 'get' data.
    """
    client = OpenAI(api_key=api_key)
    
    # Prepare the text prompt for OpenAI GPT model
    data_summary = "\n".join([f"Client {entry['id_client']}: Wanted {entry['want']}, Got {entry['get']}" for entry in data])
    prompt = f"Act as a professional Network Data Report writer. Analyze the following bandwidth data:\n{data_summary}\nProvide insights on how the bandwidth was managed without data summary, identify potential issues, and suggest improvements"

    # Call OpenAI GPT
    MODEL="gpt-4o"

    completion = client.chat.completions.create(
      model=MODEL,
      messages=[
       {"role": "system", "content": "You are a professional Network Data Report writer. Your task is to analyze network bandwidth data based on 'want' (requested bandwidth) and 'get' (actual bandwidth delivered) values. Provide insights, identify potential issues with bandwidth allocation, and suggest improvements to optimize network performance."},
        {"role": "user", "content": prompt}
      ]
    )

    return completion.choices[0].message.content


bandwidth_collection = db["bandwidth"]

def get_bandwidth_data_between_timestamps(start_timestamp, end_timestamp):
    """
    Query the MongoDB 'bandwidth' collection for entries between the given start and end timestamps.
    
    :param start_timestamp: The start of the time range (inclusive).
    :param end_timestamp: The end of the time range (inclusive).
    :return: A list of matching documents.
    """
    # Assuming start_timestamp and end_timestamp are datetime objects
    query = {
        "timestamp": {
            "$gte": start_timestamp,  # Greater than or equal to start_timestamp
            "$lte": end_timestamp  # Less than or equal to end_timestamp
        }
    }
    
    # Perform the query and return the results as a list
    data = list(bandwidth_collection.find(query))
    return data


def clean_markdown(text):
    """Removes Markdown formatting and replaces it with suitable text."""
    # Convert Markdown headers into formatted strings
    text = re.sub(r'^\s*#\s*(.+)$', r'<h1>\1</h1>', text, flags=re.MULTILINE)  # H1
    text = re.sub(r'^\s*##\s*(.+)$', r'<h2>\1</h2>', text, flags=re.MULTILINE)  # H2
    text = re.sub(r'^\s*###\s*(.+)$', r'<h3>\1</h3>', text, flags=re.MULTILINE)  # H3
    text = re.sub(r'\*\*(.+?)\*\*', r'<strong>\1</strong>', text)  # Bold
    text = re.sub(r'\*(.+?)\*', r'<em>\1</em>', text)  # Italics
    text = text.replace('\n', '<br/>')  # New line to <br/>
    return text

def generate_pdf_report(data, analysis, output_filename):
    """
    Generates a PDF report that contains both the raw bandwidth data and the analysis from OpenAI.
    """
    # Create a PDF document
    pdf = SimpleDocTemplate(output_filename, pagesize=letter)
    styles = getSampleStyleSheet()

    # Create a custom style for the subtitle
    subtitle_style = ParagraphStyle(
        'Subtitle',
        parent=styles['Normal'],
        fontSize=12,
        spaceAfter=10,
        alignment=1  # Center alignment
    )
    
    elements = []
    
    # Title
    title = Paragraph("Bandwidth Management Report", styles['Title'])
    elements.append(title)

    # Subtitle
    subtitle = Paragraph(f"Report generated on {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}", subtitle_style)
    elements.append(subtitle)
    
    # Add some space
    elements.append(Paragraph("<br/>", styles['Normal']))
    
    # Add Bandwidth Data Header
    bandwidth_header = Paragraph("Bandwidth Data:", styles['Heading2'])
    elements.append(bandwidth_header)

    # Add Bandwidth Data Entries
    for entry in data:
        text = f"Client {entry['id_client']}: Wanted {entry['want']}, Got {entry['get']}"
        elements.append(Paragraph(text, styles['Normal']))

    # Add space before analysis
    elements.append(Paragraph("<br/>", styles['Normal']))

    # Add the Analysis Header
    analysis_header = Paragraph("Analysis:", styles['Heading2'])
    elements.append(analysis_header)
    
    # Clean the analysis text and add the content
    cleaned_analysis = clean_markdown(analysis)
    elements.append(Paragraph(cleaned_analysis, styles['Normal']))

    # Build the PDF
    pdf.build(elements)

    return output_filename



@tool
def bandwidth_report(start_timestamp: str, end_timestamp: str):
    """
    LangChain tool to generate a bandwidth report for data between two timestamps.
    Queries the MongoDB database, analyzes the data, and generates a PDF report.
    
    :param start_timestamp: Start timestamp in the format "YYYY-MM-DD HH:MM:SS".
    :param end_timestamp: End timestamp in the format "YYYY-MM-DD HH:MM:SS".
    :return: Path to the generated report or a message indicating no data was found.
    """
    # Convert timestamp strings to datetime objects
    start_timestamp_dt = datetime.strptime(start_timestamp, "%Y-%m-%d %H:%M:%S")
    end_timestamp_dt = datetime.strptime(end_timestamp, "%Y-%m-%d %H:%M:%S")

    # Query MongoDB for the data between the timestamps
    data = get_bandwidth_data_between_timestamps(start_timestamp_dt, end_timestamp_dt)

    if not data:
        return f"No data found between {start_timestamp} and {end_timestamp}"

    analysis = analyze_bandwidth_data(data, api_key)

    # Generate PDF report
    output_filename = f"bandwidth_report_{start_timestamp_dt.strftime('%Y%m%d_%H%M%S')}_to_{end_timestamp_dt.strftime('%Y%m%d_%H%M%S')}.pdf"
    generate_pdf_report(data, analysis, output_filename)

    return f"Report generated successfully: {output_filename}"
