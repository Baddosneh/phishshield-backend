
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

# Email Generation Model (UPDATED)
EMAIL_GEN_MODEL_NAME = "sagorsarker/emailgenerator"
email_gen_tokenizer = AutoTokenizer.from_pretrained(EMAIL_GEN_MODEL_NAME)
email_gen_model = AutoModelForCausalLM.from_pretrained(EMAIL_GEN_MODEL_NAME)

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

@app.route("/generate_email", methods=["POST"])
def generate_email():
    """
    Generate an email using the sagorsarker/emailgenerator model.
    Expects JSON: {
        "prompt": str,
        "token_count": int,
        "temperature": float,
        "n_gen": int,
        "keywords": list
    }
    Returns:
    {
        "status": str,
        "ai_results": [
            { "generated_text": str, "text_length": int },
            ...
        ]
    }
    """
    data = request.get_json()
    prompt = data.get("prompt")
    token_count = data.get("token_count", 256)
    temperature = data.get("temperature", 0.8)
    n_gen = data.get("n_gen", 1)
    keywords = data.get("keywords", [])

    if not prompt:
        return jsonify({"status": "error", "message": "Missing prompt"}), 400

    # Optionally, append keywords to the prompt to guide generation
    if keywords and isinstance(keywords, list) and len(keywords) > 0:
        prompt += "\nKeywords: " + ", ".join(str(k) for k in keywords)

    try:
        inputs = email_gen_tokenizer(prompt, return_tensors="pt")
        outputs = email_gen_model.generate(
            **inputs,
            max_length=token_count,
            num_return_sequences=n_gen,
            do_sample=True,
            temperature=temperature,
            top_k=50,
            top_p=0.95,
            pad_token_id=email_gen_tokenizer.eos_token_id if email_gen_tokenizer.eos_token_id is not None else email_gen_tokenizer.pad_token_id
        )
        # If only one generation, outputs shape is (1, seq_len)
        # If multiple, outputs shape is (n_gen, seq_len)
        ai_results = []
        for i in range(n_gen):
            generated_text = email_gen_tokenizer.decode(outputs[i], skip_special_tokens=True)
            ai_results.append({
                "generated_text": generated_text,
                "text_length": len(generated_text)
            })
        print(f"AI results: {ai_results}")
        return jsonify({"status": "success", "ai_results": ai_results}), 200
    except Exception as e:
        print(f"Error during email generation: {e}")
        return jsonify({"status": "error", "message": "Email generation failed"}), 500

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5001)
