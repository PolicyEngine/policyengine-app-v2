export const TOKEN_FETCH_CODE = `import requests
import json

CLIENT_ID = "YOUR_CLIENT_ID"
CLIENT_SECRET = "YOUR_CLIENT_SECRET"

payload = {
  "client_id": CLIENT_ID,
  "client_secret": CLIENT_SECRET,
  "audience": "https://household.api.policyengine.org",
  "grant_type": "client_credentials"
}

headers = { "content-type": "application/json" }

auth_response = requests.post(
  "https://policyengine.uk.auth0.com/oauth/token",
  headers=headers,
  json=payload
)

result = auth_response.json()
print(result["access_token"])`;

export const TOKEN_RESPONSE_CODE = `{
  "access_token": "YOUR_ACCESS_TOKEN",
  "token_type": "Bearer"
}`;

export const getCalculateRequestCode = (countryId: string) => `import requests

url = "https://household.api.policyengine.org/${countryId}/calculate"

headers = {
    "Authorization": "Bearer YOUR_TOKEN_HERE",
    "Content-Type": "application/json",
}

household_data = {
  "household": {
    "people": {
      "parent": {
        "age": { "2023": 30 },
        "employment_income": { "2023": 20000 }
      },
      "child": {
        "age": { "2023": 5 }
      }
    },
    "households": {
      "household": {
        "members": ["parent", "child"]
      }
    }
  }
}

response = requests.post(url, headers=headers, json=household_data)
print(response.json())`;
