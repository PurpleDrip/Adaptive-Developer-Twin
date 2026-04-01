import csv
import random
import os
from datetime import datetime, timedelta

class ADTDataSynthesizer:
    """
    Generates synthetic telemetry datasets for 'Top Tier' commercial ADT training.
    Profiles: 
    - Beginner Human (low WPM, inconsistent)
    - Expert Human (high WPM, consistent commands)
    - Bot / Scripted (zero jitter, robotic stats - used to train Anomaly Detector)
    """
    
    FILE_NAME = "telemetry_training_set.csv"

    @staticmethod
    def generate_human_record(user_id="human_dev"):
        # Real humans have 'jitter' (variability)
        duration = random.uniform(5.0, 60.0) 
        wpm = random.gauss(50, 15) # Mean 50, Std Dev 15
        keystrokes = int(wpm * duration * random.uniform(0.8, 1.2))
        commands = random.randint(5, 30)
        
        return {
            "user_id": user_id,
            "type": "human",
            "duration": round(duration, 2),
            "wpm": round(max(5, wpm), 2),
            "keystrokes": keystrokes,
            "commands": commands,
            "errors": random.randint(0, 10),
            "label": 1 # 1 = Reliable
        }

    @staticmethod
    def generate_bot_record(user_id="bot_007"):
        # Bots have Zero Jitter and fixed ratios
        duration = 10.0 # Fixed
        wpm = 120.0 # Robotic fixed high WPM
        keystrokes = int(wpm * duration) # Perfect ratio
        commands = 100 # Extremely high/repetitive
        
        return {
            "user_id": user_id,
            "type": "bot",
            "duration": round(duration, 2),
            "wpm": round(wpm, 2),
            "keystrokes": keystrokes,
            "commands": commands,
            "errors": 0,
            "label": -1 # -1 = Anomaly
        }

    def create_dataset(self, samples=500):
        data = []
        # Generate 450 human records (90%)
        for i in range(int(samples * 0.9)):
            data.append(self.generate_human_record(f"dev_{i}"))
            
        # Generate 50 bot records (10%)
        for i in range(int(samples * 0.1)):
            data.append(self.generate_bot_record(f"bot_{i}"))
            
        random.shuffle(data)
        
        path = os.path.join(os.getcwd(), self.FILE_NAME)
        with open(path, 'w', newline='') as f:
            writer = csv.DictWriter(f, fieldnames=data[0].keys())
            writer.writeheader()
            writer.writerows(data)
            
        return path

if __name__ == "__main__":
    synthesizer = ADTDataSynthesizer()
    file_path = synthesizer.create_dataset(samples=1000)
    print(f"✅ Success! Generated 'Top Tier' Training Dataset: {file_path}")
    print("This dataset includes 900 Human records and 100 Bot/Manipulated records for Anomaly Detection training.")
