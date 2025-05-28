from flask import Flask, render_template, request, jsonify

app = Flask(__name__)

@app.route('/')
def index():
    """Render the main lava lamp page."""
    return render_template('index.html')

@app.route('/update_sentiment', methods=['POST'])
def update_sentiment():
    """
    Endpoint for future sentiment analysis integration.
    Will receive sentiment data and return color configurations.
    """
    # This is a placeholder for future sentiment analysis integration
    data = request.get_json()
    
    # Placeholder response - in the future, this would be based on actual sentiment analysis
    response = {
        'success': True,
        'colorConfig': {
            'baseColor': [255, 100, 50],  # Reddish
            'accentColor': [255, 200, 0],  # Yellow
            'intensity': 0.8,
            'complexity': 5
        }
    }
    
    return jsonify(response)

if __name__ == '__main__':
    app.run(debug=True)