
import torch
from transformers import AutoTokenizer, AutoModelForSequenceClassification, AutoModelForCausalLM
from flask import Flask, request, jsonify

app = Flask(__name__)

# URL Analyzer Model
URL_MODEL_NAME = "elftsdmr/malware-url-detect"
url_tokenizer = AutoTokenizer.from_pretrained(URL_MODEL_NAME)
url_model = AutoModelForSequenceClassification.from_pretrained(URL_MODEL_NAME)
URL_LABELS = ["benign", "malware"]

# Email Analyzer Model
EMAIL_MODEL_NAME = "zionia/email-phishing-detector"
email_tokenizer = AutoTokenizer.from_pretrained(EMAIL_MODEL_NAME)
email_model = AutoModelForSequenceClassification.from_pretrained(EMAIL_MODEL_NAME)
EMAIL_LABELS = ["legitimate", "phishing"]



def analyze_text(text, model, tokenizer, labels):
    """Analyze text using a transformers model"""
    inputs = tokenizer(
        text,
        return_tensors="pt",
        truncation=True,
        max_length=512
    )
    with torch.no_grad():
        outputs = model(**inputs)
        predictions = torch.nn.functional.softmax(outputs.logits, dim=-1)
        probs = predictions[0].tolist()
    labels_dict = {label: prob for label, prob in zip(labels, probs)}
    max_label = max(labels_dict.items(), key=lambda x: x[1])
    return {
        "prediction": max_label[0],
        "confidence": max_label[1],
        "all_probabilities": labels_dict
    }

@app.route("/analyze_url", methods=["POST"])
def analyze_url():
    """Analyze a URL for malicious content using the transformers model"""
    data = request.get_json()
    url = data.get("url")
    if not url:
        return jsonify({"error": "Missing url"}), 400
    try:
        result = analyze_text(url, url_model, url_tokenizer, URL_LABELS)
        return jsonify(result)
    except Exception as e:
        print(f"Error during URL scan: {e}")
        return jsonify({"error": "URL scan failed"}), 500

@app.route("/analyze_email", methods=["POST"])
def analyze_email():
    """Analyze an email for phishing using the transformers model"""
    data = request.get_json()
    email_text = data.get("email_text")
    if not email_text:
        return jsonify({"error": "Missing email_text"}), 400
    try:
        result = analyze_text(email_text, email_model, email_tokenizer, EMAIL_LABELS)
        return jsonify(result)
    except Exception as e:
        print(f"Error during email analysis: {e}")
        return jsonify({"error": "Email analysis failed"}), 500



if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5001)
