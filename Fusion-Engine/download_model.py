from transformers import AutoTokenizer, AutoModel
import torch

MODEL_NAME = "microsoft/codebert-base"
print(f"Pre-downloading {MODEL_NAME} for production image...")
tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME)
model = AutoModel.from_pretrained(MODEL_NAME)
print("Model download complete.")
