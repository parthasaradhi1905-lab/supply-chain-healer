import schedule
import time

from event_collector import collect_events
from dataset_builder import build_dataset
from trainer import retrain_model
from model_registry import save_model

def retrain_pipeline():
    print("Triggering Continual Learning Pipeline...")
    events = collect_events()
    dataset = build_dataset(events)
    
    print(f"Collected {len(dataset)} valid training samples.")
    model = retrain_model(dataset)
    
    if model:
        print("Model retrained successfully!")
        
        # In a real environment version would be iterated
        save_model(model, version=1)

# schedule.every().24.hours.do(retrain_pipeline)

if __name__ == "__main__":
    # Test run once
    retrain_pipeline()

    # To run forever:
    # while True:
    #     schedule.run_pending()
    #     time.sleep(60)
