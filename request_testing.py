import requests

response = requests.get("http://127.0.0.1:8000/api/",json={"message": "solve x - 86 = 0"
                                                           })

print(response.text)