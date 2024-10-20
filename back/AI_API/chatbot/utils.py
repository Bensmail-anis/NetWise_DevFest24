from openai import OpenAI
from decouple import config
from chatbot.network_db import db

def get_mongo_query(user_query):

  client = OpenAI(
      # This is the default and can be omitted
      api_key= config("CODE_CORTEX")
  )

  chat_completion = client.chat.completions.create(
      messages=[
                {
        "role": "system",
        "content": "You are a helpful assistant that translates delimited text into MongoDB queries."
      },
      {
        "role": "user",
        "content":  f"\
        Translate the delimited text by three backticks to a MongoDB query directly without explanations.\
        The 'devfest' database contains three collections: managers, which includes fields for '_id' (ObjectId),\
        'email' (String), 'password' (String), 'min' (Numeric), and 'max' (Numeric);\
        bandwidth, featuring '_id' (ObjectId), 'id_client' (ObjectId), 'timestamp' (DateTime), 'want' (Numeric),\
        'get' (Numeric), and '__v' (Number); and clients, with fields for '_id' (ObjectId)\
        , 'id_manager' (ObjectId), 'connected' (Boolean), 'max' (Numeric), and '__v' (Number). Don't forget to put the document keys between '': ```{user_query}``` \
        if the user query can not be interpreted as a MongoDB query , Don't talk about the queries and use your own knowledge to assist him"
      },
      {
        "role": "assistant",
        "content": "db.managers.find({'email': 'alice@example.com'}, {'_id': 0, 'email': 1})"
      }
      ],
      model="gpt-4o",
      temperature=0,
  )
  return chat_completion.choices[0].message.content



def execute_mongo_query(mongo_query):

      collection_name = mongo_query.split(".")[1].split(".")[0] 
      first_dic = eval(mongo_query.split("find(")[1].split(")")[0].split(",", maxsplit=1)[0])
      second_dic = eval(mongo_query.split("find(")[1].split(")")[0].split("," , maxsplit=1)[1].strip())


      # Access the specified collection
      collection = db[collection_name]

      # Execute the query
      result = collection.find(first_dic, second_dic)

      # Print the results
      return [client for client in result]