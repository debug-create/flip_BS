# DRISHTI Model Training

Colab notebook for fine-tuning YOLOv8 on Indian traffic datasets.

## Quick start

1. Open `DRISHTI_YOLOv8_Training.ipynb` in [Google Colab](https://colab.research.google.com/)
2. **Runtime → Change runtime type → T4 GPU**
3. Paste your Roboflow API key in Cell 4
4. **Runtime → Run all** (~25–35 min on free T4)
5. Download `drishti_best.pt` from Cell 9
6. Rename and place at `drishti-backend/models/drishti.pt`
7. Restart backend — fine-tuned weights load automatically

## Roboflow API key

Free key: https://app.roboflow.com/settings/api

## Datasets used

| Dataset | Roboflow project | Purpose |
|---------|------------------|---------|
| Helmet detection | `helmet-detection-pn5d0` v5 | Helmet violations + riders |
| Vehicle detection | `vehicle-detection-3mmwj` v1 | Cars, buses, trucks, motorcycles |

## Target classes (11)

`motorcycle`, `car`, `bus`, `truck`, `person`, `helmet_violation`, `triple_riding`, `stop_line_violation`, `red_light_violation`, `illegal_parking`, `wrong_side`

Not all violation classes have labels in the source datasets yet — the schema is ready for future labeling rounds.
