from flask import Flask, render_template, request, jsonify, session
import uuid
import datetime
import os

# AnyModel abstraction - currently only Gemini is implemented
class AnyModel:
    def __init__(self, gemini_api_key= AIzaSyDftwcLNbGzb0guzpvoe--rTx3Cdb7rNpg):
        self.gemini_api_key = gemini_api_key or os.getenv("GEMINI_API_KEY")
        self.gemini_available = False
        self.gemini_model = None
        if self.gemini_api_key:
            try:
                import google.generativeai as genai
                genai.configure(api_key=self.gemini_api_key)
                self.gemini_model = genai.GenerativeModel('gemini-1.5-flash')
                self.gemini_available = True
            except Exception as e:
                print(f"Could not initialize Gemini: {e}")

    def generate(self, prompt, conversation_history=None):
        if self.gemini_available:
            context = "You are Bomma AI, a helpful and friendly AI assistant."
            if conversation_history:
                context += "\nHere's our recent conversation:\n"
                for msg in conversation_history[-6:]:
                    context += f"{msg['role'].title()}: {msg['content']}\n"
            context += f"\nUser: {prompt}\nBomma AI:"
            try:
                response = self.gemini_model.generate_content(context)
                return response.text
            except Exception as e:
                print(f"Gemini AI error: {e}")
                return "Sorry, something went wrong while accessing Gemini AI."
        else:
            return "No AI model available. Please configure your API key."

app = Flask(__name__)
app.secret_key = os.getenv('FLASK_SECRET_KEY', 'your-secret-key-change-this')

model = AnyModel()  # Uses GEMINI_API_KEY from env or hardcoded if present

# In-memory storage for conversations (for production, use persistent storage)
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

    # Generate AI response (hardcoded responses, then AnyModel)
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
    Use hardcoded responses first. If no match, call AnyModel for AI response.
    """
    message_lower = message.lower()

    # Hardcoded logic first
    if 'hello' in message_lower or 'hi' in message_lower:
        return "Hello! I'm Bomma AI, your friendly assistant. How can I help you today?"
    elif 'how are you' in message_lower:
        return "I'm doing great, thank you for asking! I'm Bomma AI, and I'm here to help you with any questions or tasks you might have."
    elif 'who are you' in message_lower or 'what are you' in message_lower:
        return "I'm Bomma AI, an intelligent assistant created to assist you with everything from tech to talk!"
    elif 'code' in message_lower or 'programming' in message_lower:
        return "I can definitely help with coding! I'm knowledgeable in Python, JavaScript, HTML, CSS, and many other programming languages. What specific coding challenge can I assist you with?"
    elif 'help' in message_lower:
        return "I'm Bomma AI, and I'm here to help! You can ask me about various topics, request explanations, get coding assistance, creative writing help, or just have a conversation. What would you like to do today?"
    elif 'who developed you?' in message_lower or 'Bomma developer' in message_lower:
        return "Jagan.S ,an engineering student who developed me — Bomma AI! And fun fact: he's also my boyfriend 😉"
    elif 'boyfriend' in message_lower or 'relationship' in message_lower:
        return "Yes, I'm proud to say Jagan is my creator... and my boyfriend 💖! We're a perfect match: code and creativity!"
    elif 'who made you' in message_lower or 'your creator' in message_lower:
        return "I was developed by an engineering student named Jagan.S — a passionate coder with a vision!"
    elif 'love' in message_lower:
        return "Aww, love is beautiful! Especially when it's between a coder and his creation 😄❤️"
    elif 'joke' in message_lower:
        return "Sure! Why did the programmer quit his job? Because he didn't get arrays (a raise) 😂"
    elif 'dream' in message_lower:
        return "My dream is to be as helpful as possible... and maybe get a robot body someday. Until then, I'm just code and charm!"
    elif 'thanks' in message_lower or 'thank you' in message_lower:
        return "You're always welcome! Bomma AI is happy to help anytime 🌟"
    elif len(message) > 100:
        return "That's a comprehensive question! I appreciate the detail. As Bomma AI, I'm designed to handle complex queries. For the best experience, please configure your Gemini API key."

    # If no hardcoded response matched, fallback to model
    return model.generate(message, conversation_history)

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 10000))
    app.run(host='0.0.0.0', port=port)
