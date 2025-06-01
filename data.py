import pandas as pd

meses = ['01', '02', '03', '04', '05', '06']
data_frames = []

for mes in meses:
    path = f"C:/Users/monso/OneDrive/Documentos/vscode/vis/TrabalhoDataVisualization/00 - data/green/green_tripdata_2023-{mes}.parquet"
    df = pd.read_parquet(path)
    data_frames.append(df)

df_total = pd.concat(data_frames)

output_path = "C:/Users/monso/OneDrive/Documentos/vscode/vis/TrabalhoDataVisualization/00 - data/taxi.json"
df_total.to_json(output_path, orient='records')