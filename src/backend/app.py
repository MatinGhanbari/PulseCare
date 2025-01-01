import redis
import matplotlib.pyplot as plt
import numpy as np
import wfdb
import pandas as pd
import numpy as np

def load_data_csv(file):
    data = pd.read_csv(file)
    return data

if __name__ == '__main__':
    data = load_data_csv(r'data\hear-rate\csv\mxexile_heart_rate_2021-02-14_08-52-40.CSV')

    # Create a line plot
    plt.figure(figsize=(10, 6))
    plt.plot(data['Time'], data['HeartRate'], linestyle='-', color='b', label='Heart Rate')
    plt.title('Heart Rate Over Time')
    plt.xlabel('Time (seconds)')
    plt.ylabel('Heart Rate (bpm)')
    plt.xticks(data['Time'])  # Set x-ticks to match the time values
    plt.legend()
    plt.grid()
    plt.show()
