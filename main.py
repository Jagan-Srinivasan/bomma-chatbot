
from flask import Flask, render_template, request, jsonify, session
import uuid
import datetime
import json
import os
import google.generativeai as genai

app = Flask(__name__)
app.secret_key = 'your-secret-key-change-this'

# Configure Gemini AI
GEMINI_API_KEY = os.getenv('GEMINI_API_KEY') or 'AIzaSyBuWr2BQGvYvG8Sbheqd7cjZyTtnaIr0SU'
if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)
    model = genai.GenerativeModel('gemini-1.5-flash')
else:
    model = None

# In-memory storage for conversations (in production, use a database)
conversations = {}

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/chat', methods=['POST'])
def chat():
    data = request.get_json()
    message = data.get('message', '').strip()
    
    if not message:
        return jsonify({'error': 'Message is required'}), 400
    
    # Get or create conversation ID
    conversation_id = session.get('conversation_id')
    if not conversation_id:
        conversation_id = str(uuid.uuid4())
        session['conversation_id'] = conversation_id
        conversations[conversation_id] = {
            'messages': [],
            'created_at': datetime.datetime.now().isoformat()
        }
    
    # Ensure conversation exists
    if conversation_id not in conversations:
        conversations[conversation_id] = {
            'messages': [],
            'created_at': datetime.datetime.now().isoformat()
        }
    
    # Add user message
    user_message = {
        'role': 'user',
        'content': message,
        'timestamp': datetime.datetime.now().isoformat()
    }
    conversations[conversation_id]['messages'].append(user_message)
    
    # Generate AI response (mock response for now)
    ai_response = generate_ai_response(message, conversations[conversation_id]['messages'])
    
    # Add AI message
    ai_message = {
        'role': 'assistant',
        'content': ai_response,
        'timestamp': datetime.datetime.now().isoformat()
    }
    conversations[conversation_id]['messages'].append(ai_message)
    
    return jsonify({
        'response': ai_response,
        'conversation_id': conversation_id
    })

@app.route('/api/conversations', methods=['GET'])
def get_conversations():
    conversation_id = session.get('conversation_id')
    if not conversation_id or conversation_id not in conversations:
        return jsonify({'messages': []})
    
    return jsonify({'messages': conversations[conversation_id]['messages']})

@app.route('/api/new-chat', methods=['POST'])
def new_chat():
    # Clear current conversation
    if 'conversation_id' in session:
        del session['conversation_id']
    return jsonify({'success': True})

@app.route('/api/clear-history', methods=['POST'])
def clear_history():
    conversation_id = session.get('conversation_id')
    if conversation_id and conversation_id in conversations:
        conversations[conversation_id]['messages'] = []
    return jsonify({'success': True})

def generate_ai_response(message, conversation_history):
    """
    Generate AI response using Gemini AI or fallback to demo responses.
    """
    if model and GEMINI_API_KEY:
        try:
            # Build conversation context for Gemini
            context = "You are Bomma AI, a helpful and friendly AI assistant. You are knowledgeable, creative, and always try to provide accurate and helpful responses. "
            
            # Add recent conversation history for context
            if len(conversation_history) > 1:
                context += "Here's our recent conversation:\n"
                for msg in conversation_history[-6:]:  # Last 3 exchanges
                    context += f"{msg['role'].title()}: {msg['content']}\n"
            
            context += f"\nUser: {message}\nBomma AI:"
            
            response = model.generate_content(context)
            return response.text
            
        except Exception as e:
            print(f"Gemini AI error: {e}")
            # Fallback to demo response
            pass
    
    # Fallback demo responses when Gemini is not available
    message_lower = message.lower()
    
    if 'hello' in message_lower or 'hi' in message_lower:
        return "Hello! I'm Bomma AI, your friendly assistant. How can I help you today?"
    elif 'how are you' in message_lower:
        return "I'm doing great, thank you for asking! I'm Bomma AI, and I'm here to help you with any questions or tasks you might have."
    elif 'who are you' in message_lower or 'what are you' in message_lower:
        return "I'm Bomma AI, an intelligent assistant powered by advanced AI technology. I'm here to help you with information, coding, creative tasks, and much more!"
    elif 'code' in message_lower or 'programming' in message_lower:
        return "I can definitely help with coding! I'm knowledgeable in Python, JavaScript, HTML, CSS, and many other programming languages. What specific coding challenge can I assist you with?"
    elif 'help' in message_lower:
        return "I'm Bomma AI, and I'm here to help! You can ask me about various topics, request explanations, get coding assistance, creative writing help, or just have a conversation. What would you like to explore?"
    elif len(message) > 100:
        return "That's a comprehensive question! I appreciate the detail. As Bomma AI, I'm designed to handle complex queries. For the best experience, please set up your Gemini API key in the Secrets tool to unlock my full capabilities!"
    else:
        return f"Thanks for reaching out! I'm Bomma AI, and I'd love to help with that. Currently running in demo mode - to experience my full potential, please configure your Gemini API key in the Secrets tool."

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
