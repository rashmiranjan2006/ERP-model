from flask import Flask, send_from_directory
from flask_cors import CORS
import os
from .extensions import db
from . import erp_models
from . import routes

app = Flask(__name__, static_folder='../dist', static_url_path='')
CORS(app)

# Serve favicon
@app.route('/favicon.ico')
def favicon():
    return send_from_directory(app.static_folder, 'favicon.png', mimetype='image/png')

# Serve React static assets
@app.route('/assets/<path:filename>')
def assets(filename):
    return send_from_directory(os.path.join(app.static_folder, 'assets'), filename)

# Serve React index.html for all frontend routes
@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve_frontend(path):
    return send_from_directory(app.static_folder, 'index.html')

# Configure MySQL connection (update with your credentials)
app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('MYSQL_URI', 'mysql+pymysql://user:password@localhost/erp_timetable')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['JWT_SECRET_KEY'] = 'your-secret-key'  # Change this in production

db.init_app(app)

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0')
