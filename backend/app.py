from flask import Flask, request, jsonify
from flask_cors import CORS
import numpy as np
import json
import os

app = Flask(__name__)
CORS(app)

WEIGHTS_PATH  = 'model/weights.npz'
LABELMAP_PATH = 'model/label_map.json'

model     = None
label_map = None

def build_model(num_classes):
    from tensorflow.keras.models import Sequential
    from tensorflow.keras.layers import Dense, Dropout, BatchNormalization
    m = Sequential([
        Dense(256, activation='relu', input_shape=(63,)),
        BatchNormalization(),
        Dropout(0.3),
        Dense(128, activation='relu'),
        BatchNormalization(),
        Dropout(0.3),
        Dense(64, activation='relu'),
        Dropout(0.2),
        Dense(num_classes, activation='softmax')
    ])
    return m

def load_model():
    global model, label_map
    try:
        with open(LABELMAP_PATH, 'r') as f:
            label_map = json.load(f)
        num_classes = len(label_map)
        model = build_model(num_classes)
        weights_data = np.load(WEIGHTS_PATH, allow_pickle=True)
        weights = [weights_data[f'arr_{i}'] for i in range(len(weights_data.files))]
        model.set_weights(weights)
        print("Model loaded successfully")
        print(f"Signs: {list(label_map.values())}")
    except Exception as e:
        print(f"Model not loaded: {e}")
        print("Running in mock mode")

@app.route('/', methods=['GET'])
def home():
    return jsonify({
        'status':  'running',
        'team':    'Team ALPHA',
        'project': 'ISL Bridge',
        'model':   'loaded' if model else 'not loaded yet'
    })

@app.route('/predict', methods=['POST'])
def predict():
    try:
        data = request.get_json()
        if not data or 'landmarks' not in data:
            return jsonify({'error': 'No landmarks provided'}), 400

        landmarks = np.array(data['landmarks'])

        if model and label_map:
            landmarks  = landmarks.reshape(1, -1)
            prediction = model.predict(landmarks, verbose=0)
            class_idx  = int(np.argmax(prediction))
            confidence = float(np.max(prediction)) * 100
            sign       = label_map.get(str(class_idx), 'Unknown')
            return jsonify({
                'sign':       sign,
                'confidence': round(confidence, 2),
                'mode':       'model'
            })
        else:
            import random
            mock_signs = [
                'I need help', 'Call doctor', 'I am in pain',
                'Thank you',   'I am deaf',   'Call police',
                'Water please','Emergency',   'I am lost',
                'I am hungry'
            ]
            return jsonify({
                'sign':       random.choice(mock_signs),
                'confidence': round(random.uniform(85, 98), 2),
                'mode':       'mock'
            })

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/health', methods=['GET'])
def health():
    return jsonify({
        'status':      'healthy',
        'model':       'loaded' if model else 'not loaded',
        'signs_count': len(label_map) if label_map else 0
    })

@app.route('/signs', methods=['GET'])
def get_signs():
    if label_map:
        return jsonify({'signs': list(label_map.values())})
    return jsonify({'signs': [], 'note': 'Model not loaded yet'})

if __name__ == '__main__':
    load_model()
    app.run(host='0.0.0.0', port=5000, debug=True)