from flask import Flask, jsonify, request
from flask_cors import CORS

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}}, allow_headers="*")

# Define the JSON response for /api/courses/hierarchy
response_data = {
    "count": 2,
    "results": [
        {
            "id": 1,
            "name": "Introduction to Data Science",
            "description": "A foundational course in data science covering essential topics.",
            "modules": [
                {
                    "id": 1,
                    "title": "Introduction to Data Science",
                    "sequence": 1,
                    "description": "An overview of data science principles and applications.",
                    "sections": [
                        {
                            "id": 1,
                            "title": "What is Data Science?",
                            "sequence": 1,
                            "description": "Introduction to the field of data science and its importance."
                        },
                        {
                            "id": 2,
                            "title": "Applications of Data Science",
                            "sequence": 2,
                            "description": "Exploring real-world applications of data science in various industries."
                        }
                    ]
                },
                {
                    "id": 2,
                    "title": "Data Manipulation and Analysis",
                    "sequence": 2,
                    "description": "Learn techniques for manipulating and analyzing data.",
                    "sections": [
                        {
                            "id": 3,
                            "title": "Introduction to DataFrames",
                            "sequence": 1,
                            "description": "Working with tabular data using DataFrames."
                        },
                        {
                            "id": 4,
                            "title": "Data Cleaning Techniques",
                            "sequence": 2,
                            "description": "Cleaning and preprocessing data for analysis."
                        }
                    ]
                }
            ]
        },
        {
            "id": 2,
            "name": "Machine Learning Basics",
            "description": "A beginner's guide to machine learning concepts and techniques.",
            "modules": [
                {
                    "id": 3,
                    "title": "Understanding Machine Learning",
                    "sequence": 1,
                    "description": "An introduction to machine learning concepts and types.",
                    "sections": [
                        {
                            "id": 5,
                            "title": "What is Machine Learning?",
                            "sequence": 1,
                            "description": "Definition and significance of machine learning."
                        },
                        {
                            "id": 6,
                            "title": "Types of Machine Learning",
                            "sequence": 2,
                            "description": "Supervised, unsupervised, and reinforcement learning."
                        }
                    ]
                },
                {
                    "id": 4,
                    "title": "Building Machine Learning Models",
                    "sequence": 2,
                    "description": "A guide to building, training, and evaluating machine learning models.",
                    "sections": [
                        {
                            "id": 7,
                            "title": "Data Preparation for Modeling",
                            "sequence": 1,
                            "description": "Steps to prepare data for machine learning models."
                        },
                        {
                            "id": 8,
                            "title": "Model Training and Evaluation",
                            "sequence": 2,
                            "description": "Training machine learning models and evaluating their performance."
                        }
                    ]
                }
            ]
        }
    ]
}

# Global list to store POST request data for /output
received_data = []

@app.route('/api/courses/hierarchy', methods=['GET'])
def get_data():
    return jsonify(response_data)

@app.route('/output', methods=['POST', 'GET'])
def handle_output():
    global received_data

    if request.method == 'POST':
        # Parse the JSON data from the request
        data = request.get_json()
        if data:
            received_data.append(data)
            return jsonify({"message": "Data received", "data": data}), 201
        else:
            return jsonify({"error": "Invalid data"}), 400

    elif request.method == 'GET':
        # Return all received data
        return jsonify({"received_data": received_data}), 200


if __name__ == "__main__":
    app.run(debug=True)