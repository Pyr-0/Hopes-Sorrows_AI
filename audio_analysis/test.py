import openai


#OPENAI_API_KEY = "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"
OPENAI_API_KEY = "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"
client = openai.OpenAI(api_key=OPENAI_API_KEY)


response = client.chat.completions.create(
			model="gpt-4o-mini",  # or "gpt-4o-mini" if supported
			messages=[
				{"role": "system", "content": "You are a comedian"},
				{"role": "user", "content": "tell me a joke about donald trump"}
			])
#temperature=0.3)

print(response.choices[0].message.content)