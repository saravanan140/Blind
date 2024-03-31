from flask import Flask, jsonify, request
from flask_cors import CORS
import requests
from flask_sslify import SSLify

app = Flask(__name__)
CORS(app)  # Apply CORS to your Flask app
sslify = SSLify(app)

@app.route('/directions')
def get_directions():
    origin = request.args.get('origin')
    destination = request.args.get('destination')
    key = request.args.get('key')
    
    url = f'https://maps.googleapis.com/maps/api/directions/json?origin={origin}&destination={destination}&key={key}'
    
    try:
        response = requests.get(url)
        data = response.json()
        
        # Add destination details to the response
        data['destination'] = destination
        
        return jsonify(data)
    except Exception as e:
        print('Error fetching directions:', e)
        return jsonify({'error': 'Error fetching directions'}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', debug=True)

