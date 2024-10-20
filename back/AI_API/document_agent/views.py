from document_agent.utils import bandwidth_report
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from langchain_openai import ChatOpenAI
from decouple import config
from document_agent.serializers import BandwidthReportRequestSerializer
from langgraph.prebuilt import create_react_agent
import os
from django.http import FileResponse

api_key = config("CODE_CORTEX")

class BandwidthReportView(APIView):
    def post(self, request):
        # Use the serializer to validate the input data
        serializer = BandwidthReportRequestSerializer(data=request.data)
        if serializer.is_valid():
            input_message = serializer.validated_data['message']

            # Initialize the language model and the agent with the bandwidth report tool
            llm = ChatOpenAI(model="gpt-4o-mini", api_key=api_key, temperature=0)
            agent = create_react_agent(llm, [bandwidth_report])  # Use your defined bandwidth_report tool

            # Invoke the agent with the user's message
            messages = agent.invoke({
                "messages": [
                    ("human", input_message)
                ]
            })

            # Define the output filename for the PDF report
            output_message = messages['messages'][-1].content
            print(f"Generated message: {output_message}")
            
            # Extract the file name from the output message
            if "download it [here](sandbox:" in output_message:
                start_index = output_message.find("sandbox:") + len("sandbox:")
                end_index = output_message.find(")", start_index)
                output_filename = output_message[start_index:end_index].strip()  # Strip any whitespace
                print(f"Generated filename: {output_filename}")

                if output_filename.startswith('/'):
                    output_filename = output_filename[1:]

                file_path = os.path.join(os.getcwd(), output_filename)  # Get the full path to the file
                print(f"Looking for report at: {file_path}")
                if os.path.exists(file_path):
                    # Return the file as a response for download, no need to manually close the file
                    response = FileResponse(open(file_path, 'rb'), content_type='application/pdf')
                    response['Content-Disposition'] = f'attachment; filename="{os.path.basename(file_path)}"'
                    return response
                else:
                    return Response({"error": "Report not found."}, status=status.HTTP_404_NOT_FOUND)

            else:
                return Response({"message": "Report generation failed."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        # If the serializer is not valid, return the errors
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)