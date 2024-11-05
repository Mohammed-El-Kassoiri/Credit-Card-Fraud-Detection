from flask import Flask, request, render_template, jsonify
import pandas as pd
import numpy as np
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import classification_report, confusion_matrix
import json
import warnings
warnings.filterwarnings('ignore')

app = Flask(__name__)

scaler = None
classifier = None

def load_data():
    train_df = pd.read_csv('train.csv')
    return train_df

def preprocess_data(df):
    # Séparer les features et la target
    features = df.drop(['TX_FRAUD'], axis=1)
    
    # Standardisation
    scaler = StandardScaler()
    features_scaled = scaler.fit_transform(features)
    features_scaled = pd.DataFrame(features_scaled, columns=features.columns)
    
    return features_scaled, scaler

class NumpyEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, np.integer):
            return int(obj)
        if isinstance(obj, np.floating):
            return float(obj)
        if isinstance(obj, np.ndarray):
            return obj.tolist()
        return super(NumpyEncoder, self).default(obj)

@app.route('/')
def home():
    return render_template('index.html')

@app.route('/train', methods=['GET'])
def train_models():
    global scaler, classifier
    
    try:
        # Charger et prétraiter les données
        train_df = load_data()
        features_scaled, scaler = preprocess_data(train_df)
        
        # Split the data
        X_train, X_test, y_train, y_test = train_test_split(
            features_scaled, train_df['TX_FRAUD'],
            test_size=0.2, random_state=42,
            stratify=train_df['TX_FRAUD']
        )
        
        # Train Random Forest
        classifier = RandomForestClassifier(
            n_estimators=100,
            max_depth=10,
            class_weight='balanced',
            random_state=42
        )
        classifier.fit(X_train, y_train)
        
        # Évaluation
        train_score = float(classifier.score(X_train, y_train))
        test_score = float(classifier.score(X_test, y_test))
        
        # Prédictions pour la matrice de confusion
        y_pred = classifier.predict(X_test)
        conf_matrix = confusion_matrix(y_test, y_pred)
        
        # Rapport détaillé
        report = classification_report(y_test, y_pred)
        
        # Calculer les statistiques
        stats = {
            'total_transactions': int(len(y_test)),
            'fraud_transactions': int(conf_matrix[1].sum()),
            'legitimate_transactions': int(conf_matrix[0].sum()),
            'fraud_percentage': float(train_df['TX_FRAUD'].sum() / len(train_df) * 100),
            'avg_transaction_amount': float(train_df['TX_AMOUNT'].mean()),
            'weekend_transactions_pct': float(train_df['TX_DURING_WEEKEND'].sum() / len(train_df) * 100),
            'night_transactions_pct': float(train_df['TX_DURING_NIGHT'].sum() / len(train_df) * 100)
        }
        
        return jsonify({
            'status': 'success',
            'message': 'Modèles entraînés avec succès',
            'train_accuracy': train_score,
            'test_accuracy': test_score,
            'classification_report': report,
            'data_stats': stats,
            'confusion_matrix': conf_matrix.tolist()
        })
    
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': f'Erreur lors de l\'entraînement: {str(e)}'
        })

@app.route('/predict', methods=['POST'])
def predict():
    global scaler, classifier
    
    if scaler is None or classifier is None:
        return jsonify({
            'status': 'error',
            'message': 'Modèles non entraînés. Veuillez d\'abord appeler /train'
        })
    
    try:
        # Récupérer les données de la requête
        data = request.json
        
        # Créer un DataFrame avec les colonnes nécessaires
        features = pd.DataFrame([{
            'TX_AMOUNT': float(data.get('TX_AMOUNT', 0)),
            'TX_DURING_WEEKEND': int(data.get('TX_DURING_WEEKEND', 0)),
            'TX_DURING_NIGHT': int(data.get('TX_DURING_NIGHT', 0)),
            'CUSTOMER_ID_NB_TX_1DAY_WINDOW': float(data.get('CUSTOMER_ID_NB_TX_1DAY_WINDOW', 0)),
            'CUSTOMER_ID_NB_TX_7DAY_WINDOW': float(data.get('CUSTOMER_ID_NB_TX_7DAY_WINDOW', 0)),
            'CUSTOMER_ID_NB_TX_30DAY_WINDOW': float(data.get('CUSTOMER_ID_NB_TX_30DAY_WINDOW', 0)),
            'CUSTOMER_ID_AVG_AMOUNT_1DAY_WINDOW': float(data.get('CUSTOMER_ID_AVG_AMOUNT_1DAY_WINDOW', 0)),
            'CUSTOMER_ID_AVG_AMOUNT_7DAY_WINDOW': float(data.get('CUSTOMER_ID_AVG_AMOUNT_7DAY_WINDOW', 0)),
            'CUSTOMER_ID_AVG_AMOUNT_30DAY_WINDOW': float(data.get('CUSTOMER_ID_AVG_AMOUNT_30DAY_WINDOW', 0)),
            'TERMINAL_ID_NB_TX_1DAY_WINDOW': float(data.get('TERMINAL_ID_NB_TX_1DAY_WINDOW', 0)),
            'TERMINAL_ID_NB_TX_7DAY_WINDOW': float(data.get('TERMINAL_ID_NB_TX_7DAY_WINDOW', 0)),
            'TERMINAL_ID_NB_TX_30DAY_WINDOW': float(data.get('TERMINAL_ID_NB_TX_30DAY_WINDOW', 0)),
            'TERMINAL_ID_RISK_1DAY_WINDOW': float(data.get('TERMINAL_ID_RISK_1DAY_WINDOW', 0)),
            'TERMINAL_ID_RISK_7DAY_WINDOW': float(data.get('TERMINAL_ID_RISK_7DAY_WINDOW', 0)),
            'TERMINAL_ID_RISK_30DAY_WINDOW': float(data.get('TERMINAL_ID_RISK_30DAY_WINDOW', 0))
        }])
        
        # Standardiser les features
        features_scaled = scaler.transform(features)
        
        # Faire la prédiction
        prediction_proba = classifier.predict_proba(features_scaled)[0]
        prediction = classifier.predict(features_scaled)[0]
        
        # Obtenir l'importance des features
        feature_importance = {
            str(k): float(v) for k, v in zip(
                features.columns,
                classifier.feature_importances_
            )
        }
        
        return jsonify({
            'status': 'success',
            'prediction': int(prediction),
            'fraud_probability': float(prediction_proba[1]),
            'is_fraud': bool(prediction == 1),
            'confidence': float(max(prediction_proba)),
            'feature_importance': feature_importance
        })
    
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': f'Erreur lors de la prédiction: {str(e)}'
        })

if __name__ == '__main__':
    app.run(port=8051)
