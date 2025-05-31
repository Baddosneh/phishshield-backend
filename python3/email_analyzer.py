from flask import Flask, request, jsonify
import torch
from transformers import AutoTokenizer, AutoModelForSequenceClassification

app = Flask(__name__)

EMAIL_MODEL_NAME = "zionia/email-phishing-detector"
email_tokenizer = AutoTokenizer.from_pretrained(EMAIL_MODEL_NAME)
email_model = AutoModelForSequenceClassification.from_pretrained(EMAIL_MODEL_NAME)
EMAIL_LABELS = ["legitimate", "phishing"]

def analyze_text(text, model, tokenizer, labels):
    inputs = tokenizer(text, return_tensors="pt", truncation=True, max_length=512)
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

@app.route("/analyze_email", methods=["POST"])
def analyze_email():
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