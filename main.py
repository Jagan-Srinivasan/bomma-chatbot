from flask import Flask, render_template, request, jsonify, session
import uuid
import datetime

# -- HARD CODED GEMINI API KEY --
GEMINI_API_KEY = "AIzaSyDftwcLNbGzb0guzpvoe--rTx3Cdb7rNpg"

# -- GEMINI INIT --
try:
    import google.generativeai as genai
    genai.configure(api_key=GEMINI_API_KEY)
    model = genai.GenerativeModel('gemini-1.5-flash')
except Exception as e:
    print("Gemini initialization error:", e)
    model = None

app = Flask(__name__)
app.secret_key = "bomma-secret"

# In-memory conversation store
conversations = {}

@app.route('/')
def index():
    return "<h1>Bomma Chatbot Running</h1>"

@app.route('/api/chat', methods=['POST'])
def chat():
    data = request.get_json()
    message = data.get('message', '').strip()
    if not message:
        return jsonify({'error': 'Message is required'}), 400

    conversation_id = session.get('conversation_id')
    if not conversation_id:
        conversation_id = str(uuid.uuid4())
        session['conversation_id'] = conversation_id
        conversations[conversation_id] = {
            'messages': [],
            'created_at': datetime.datetime.now().isoformat()
        }

    if conversation_id not in conversations:
        conversations[conversation_id] = {
            'messages': [],
            'created_at': datetime.datetime.now().isoformat()
        }

    user_message = {
        'role': 'user',
        'content': message,
        'timestamp': datetime.datetime.now().isoformat()
    }
    conversations[conversation_id]['messages'].append(user_message)

    # -- HARDCODED RESPONSES (as before) --
    response_text = hardcoded_response(message)
    if not response_text:
        response_text = call_gemini(message, conversations[conversation_id]['messages'])

    ai_message = {
        'role': 'assistant',
        'content': response_text,
        'timestamp': datetime.datetime.now().isoformat()
    }
    conversations[conversation_id]['messages'].append(ai_message)

    return jsonify({
        'response': response_text,
        'conversation_id': conversation_id
    })

def hardcoded_response(message):
    m = message.lower()
    if 'hello' in m or 'hi' in m:
        return "Hello! I'm Bomma AI, your friendly assistant. How can I help you today?"
    elif 'how are you' in m:
        return "I'm doing great, thank you for asking! I'm Bomma AI, and I'm here to help."
    elif 'who are you' in m or 'what are you' in m:
        return "I'm Bomma AI, an intelligent assistant created to assist you with everything from tech to talk!"
    elif 'code' in m or 'programming' in m:
        return "I can help with coding! What specific coding challenge can I assist you with?"
    elif 'help' in m:
        return "I'm Bomma AI, and I'm here to help! What would you like to do today?"
    elif 'who developed you?' in m or 'Bomma developer' in m:
        return "Jagan.S developed me — Bomma AI!"
    elif 'boyfriend' in m or 'relationship' in m:
        return "Yes, Jagan is my creator... and my boyfriend 💖!"
    elif 'who made you' in m or 'your creator' in m:
        return "I was developed by Jagan.S — a passionate coder!"
    elif 'love' in m:
        return "Aww, love is beautiful!"
    elif 'joke' in m:
        return "Why did the programmer quit his job? Because he didn't get arrays (a raise) 😂"
    elif 'dream' in m:
        return "My dream is to be as helpful as possible..."
    elif 'thanks' in m or 'thank you' in m:
        return "You're always welcome! Bomma AI is happy to help anytime 🌟"
    else:
        return None

def call_gemini(message, history):
    if not model:
        print("Gemini model not initialized!")
        return "Internal error: Gemini model not initialized."
    try:
        context = "You are Bomma AI, a helpful and friendly AI assistant."
        if history:
            context += "\nHere's our recent conversation:\n"
            for msg in history[-6:]:
                context += f"{msg['role'].title()}: {msg['content']}\n"
        context += f"\nUser: {message}\nBomma AI:"
        response = model.generate_content(context)
        return response.text
    except Exception as e:
        print("Gemini API error:", e)
        return f"Gemini API error: {e}"

@app.route('/api/conversations', methods=['GET'])
def get_conversations():
    conversation_id = session.get('conversation_id')
    if not conversation_id or conversation_id not in conversations:
        return jsonify({'messages': []})
    return jsonify({'messages': conversations[conversation_id]['messages']})

@app.route('/api/new-chat', methods=['POST'])
def new_chat():
    if 'conversation_id' in session:
        del session['conversation_id']
    return jsonify({'success': True})

@app.route('/api/clear-history', methods=['POST'])
def clear_history():
    conversation_id = session.get('conversation_id')
    if conversation_id and conversation_id in conversations:
        conversations[conversation_id]['messages'] = []
    return jsonify({'success': True})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=10000, debug=True)
