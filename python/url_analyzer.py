from flask import Flask, request, jsonify
import torch
from transformers import AutoTokenizer, AutoModelForSequenceClassification

app = Flask(__name__)

URL_MODEL_NAME = "elftsdmr/malware-url-detect"
url_tokenizer = AutoTokenizer.from_pretrained(URL_MODEL_NAME)
url_model = AutoModelForSequenceClassification.from_pretrained(URL_MODEL_NAME)
URL_LABELS = ["benign", "malware"]

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

@app.route("/analyze_url", methods=["POST"])
def analyze_url():
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

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5001)