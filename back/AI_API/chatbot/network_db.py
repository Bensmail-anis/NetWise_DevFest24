from pymongo import MongoClient
from decouple import config

DB_LINK = config("DB_LINK")

client = MongoClient(DB_LINK)
db = client["devfest"]