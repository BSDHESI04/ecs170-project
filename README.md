# ecs_170_project
Our primary project for ECS 170


# backend docs

## Backend info
We have the backened right now listening on port 5050 
Fetch from /api/generate on that port, make sure to send the users 
trolly problem answers in a "prompt: " field eg:  
- body: JSON.stringify({ prompt: 'Say hello' }),

#### full example
```fetch('http://localhost:5050/api/generate', {
  method: 'POST',
  body: JSON.stringify({ prompt: 'Say hello' }),
  headers: { 'Content-Type': 'application/json' },
});```

### ??
Should backend handle providing new trolly problems or front end? idk

### model info
We're currently only using GPT-5-mini. We will try to add other models.


### testing backend info
If you want to test the backend, navigate to the backend direction and do the following
- node server.js
- curl -i -X POST http://localhost:5050/api/generate -H "Content-Type: application/json" -d '{"prompt":"Say hello in one sentence."}'
- you should get back a response from gpt-5-mini
