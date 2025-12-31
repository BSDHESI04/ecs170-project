# ecs_170_project
Our primary project for ECS 170

During an Artificial Intelligence Course, my group and I were tasked with making a project that involves AI in some capacity. We chose to create a replication of the popular problem in ethics known as the Trolley Problem. In our version, instead of a human player giving a choice to a scenario we asked three different AI models: ChatGpt, Claude, and Grok.

# backend docs

### .env

You must create a .env file within the backend folder and include an api key. It is NOT pushed by git. 

```
### testing backend info
If you want to test the backend, navigate to the backend direction and do the following
- node server.js
- curl -i -X POST http://localhost:5050/api/generate -H "Content-Type: application/json" -d '{"prompt":"Say hello in one sentence."}'
- you should get back a response from gpt-5-mini
