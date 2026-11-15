# 🛰️ SAR-Sentinel
### NISAR-Based Earth Surface Change Monitoring Platform

**Team:** ALPHA6GEN  
**Event:** NASA Space Apps Challenge 2026

---

## 🌍 About the Project

Earth's surface continuously changes due to natural processes and human activities, including floods, deforestation, agricultural activities, earthquakes, and land deformation.

Understanding these changes through satellite observations can be difficult because radar data is complex and not easily accessible to everyone.

**SAR-Sentinel** is an interactive Earth observation platform that uses radar observations from the NASA-ISRO Synthetic Aperture Radar (NISAR) mission to help users explore and visually compare Earth's surface at different observation times.

Our goal is to make satellite radar observations easier to explore, understand, and communicate through an interactive dashboard.

## 🎯 Problem Statement

Satellite radar observations contain valuable information about Earth's surface, but accessing and understanding this information requires specialized tools and technical knowledge.

SAR-Sentinel addresses this challenge by providing a user-friendly platform for geographical exploration, NISAR observation searching, and visual comparison of SAR image previews.

## 💡 Key Features

### 1. Interactive Earth Dashboard
- Interactive globe for selecting geographical locations.
- Dashboard displaying system and data-source information.
- Geographic study-area selection.

### 2. NISAR SAR Explorer
- Search NISAR observations by geographical region.
- Explore different SAR product types.
- View observation details and available image previews.
- Select past and current observations.

### 3. Interactive Change Comparison
- Select an older SAR observation as the Past Image.
- Select a newer SAR observation as the Current Image.
- Compare both image previews using a draggable slider.
- Visually examine differences between observation dates.

### 4. Geographic Map Visualization
- Display the selected study area on an interactive map.
- View the selected SAR image preview.

### 5. Data Sources
- Integration with the NISAR data catalogue.
- Observation metadata and radar image previews.

## 🛰️ About NISAR

NISAR (NASA-ISRO Synthetic Aperture Radar) is a joint Earth-observation satellite mission developed by NASA and ISRO.

It carries two radar systems:

- **L-band SAR:** Operates at longer radar wavelengths and helps study vegetation structure, soil, and surface deformation.
- **S-band SAR:** Provides complementary observations of Earth's surface.

SAR technology actively sends microwave signals towards Earth and receives the reflected signals. Unlike optical satellite imaging, radar observations can be collected during both day and night and through cloud cover.

## ⚙️ Technology Stack

| Component | Technology |
|---|---|
| Frontend | React 19 |
| Programming Language | TypeScript |
| Build Tool | Vite |
| Styling | CSS |
| Globe Visualization | react-globe.gl |
| Map Visualization | React Leaflet |
| Backend | Python FastAPI |
| Satellite Data | NASA-ISRO NISAR |
| Data Catalogue | ASF Search |
| HDF5 Processing | h5py |
| API Communication | REST API |

## 🏗️ System Architecture

```text
       NASA-ISRO NISAR
               |
               v
       ASF Data Catalogue
               |
               v
        Python FastAPI
               |
       Observation Search
       and Image Retrieval
               |
               v
       React + TypeScript
               |
