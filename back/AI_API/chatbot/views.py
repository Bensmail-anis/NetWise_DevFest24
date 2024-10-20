from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from .serializers import ChatbotInputSerializer
from decouple import config
from langchain_core.prompts import ChatPromptTemplate
from langchain_openai import ChatOpenAI
from langchain_core.runnables import RunnablePassthrough
from langchain_core.output_parsers import StrOutputParser
import logging
from openai import OpenAI
from .utils import get_mongo_query , execute_mongo_query
from .network_db import db 

# Setup logging for debugging
logger = logging.getLogger(__name__)

class ChatbotAPIView(APIView):


    def __init__(self, **kwargs):
        super().__init__(**kwargs)

        self.openai_api_key = config("CODE_CORTEX")

    def post(self, request):
    # Validate user input
        serializer = ChatbotInputSerializer(data=request.data)
        if serializer.is_valid():
            user_input = serializer.validated_data["input_text"]
            mongo_query = get_mongo_query(user_input)
            print(mongo_query)

            try:
                data = execute_mongo_query(mongo_query)
                print(data)
            except Exception as e:
                # Log error and fallback to using get_mongo_query data
                logger.error(f"Error executing Mongo query: {str(e)}")
                data = mongo_query # Use the Mongo query as data in case of failure
                print(data)
            # Get the chatbot response using the available data (either from execute_mongo_query or fallback)
            chatbot_response = self.get_chat_response(data)
            return Response(
                {"response": chatbot_response}, status=status.HTTP_200_OK
            )
        else:
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


    def get_chat_response(self,data):


        client = OpenAI(
            api_key= self.openai_api_key
        )

        chat_completion = client.chat.completions.create(
            messages=[
                        {
                "role": "system",
                "content": "Act as a network engineer that analyze the network data you get "
            },
            {
                "role": "user",
                "content":  f"analze this data directly : {data}.Analyze the following data: {data}. If it consists of regular text, improve its quality and clarity so it can be sent to the user. Respond directly, without introductions or phrases like 'Certainly! Here's an improved version of the text.'"
            }
            ],
            model="gpt-4o",
            temperature=0,
        )
        return chat_completion.choices[0].message.content
