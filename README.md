<h1 align = center>Credit Card Fraud Detection</h1>


This is a web application that uses a machine learning model to detect credit card fraud. The application consists of a Flask-based backend API that handles data loading, preprocessing, model training, and prediction, and a web-based user interface built with HTML and JavaScript.

## Features

1. **Model Training**:
   - The application allows users to train a Random Forest Classifier model on a credit card transaction dataset.
   - The training process includes data preprocessing steps such as feature scaling and train-test split.
   - The training results are displayed, including the overall accuracy, confusion matrix, and detailed classification report.

2. **Fraud Prediction**:
   - Users can input transaction data through the web interface, including information about the transaction amount, time, customer, and terminal.
   - The application uses the trained model to predict whether the transaction is fraudulent or legitimate.
   - The prediction results are displayed, showing the probability of fraud, the confidence level of the prediction, and the feature importance.

3. **Visualization**:
   - The application includes a graphical representation of the prediction confidence distribution using a custom chart.
   - The feature importance is displayed as a bar chart, allowing users to understand which input features contribute the most to the prediction.
   - The confusion matrix is shown in a tabular format, providing detailed information about the model's performance.

Database used is [Credit Card Fraud Detection](https://www.kaggle.com/api/v1/datasets/download/elkassoirimohammed/credit-card-fraud-detection-using-flask) from Kaggle

## Installation

1. Clone the repository:
   git clone https://github.com/your-username/credit-card-fraud-detection.git

3. Create a virtual environment and install the required packages:
   cd credit-card-fraud-detection
   python -m venv venv
   source venv/bin/activate
   pip install -r requirements.txt

3. Start the Flask API:
   python app.py

4. Open the web application in your browser at `http://127.0.0.1:8051`.

## Usage

1. **Train the Model**:
   - Click the "Train" button on the web interface to start the model training process.
   - The training progress is displayed, and once completed, the training results are shown, including the overall accuracy, confusion matrix, and classification report.

2. **Make Predictions**:
   - Navigate to the "Predict" tab on the web interface.
   - Fill in the input fields with the transaction data you want to analyze.
   - Click the "Predict" button to get the prediction results.
   - The application will display the probability of the transaction being fraudulent, the confidence level of the prediction, and the feature importance.
   - The prediction confidence distribution will be visualized in the form of a custom chart.

## Contributing

If you find any issues or have suggestions for improvements, please feel free to create a new issue or submit a pull request. Contributions are welcome and appreciated.

## License

This project is licensed under the [MIT License](LICENSE).

  
