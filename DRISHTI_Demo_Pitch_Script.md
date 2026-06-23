# DRISHTI — Demonstration Video Presentation Script

This script is designed to help you narrate your walkthrough video smoothly. It guides the viewer through the dashboard layout, explains the backend telemetry, and walks through the complete upload and analysis flow step-by-step.

---

## SCENE 1: THE COMMAND CENTER DASHBOARD (HOMEPAGE)
**Visual**: Show the home page (`http://localhost:8080/`). Let the map load, and hover over the sidebar and cards.

**Voiceover Narration**:
> *"Welcome to the demonstration of DRISHTI—an intelligent, edge-to-command center traffic enforcement and vehicle compliance system.
>
> Right now, we are looking at the DRISHTI Command Center homepage. On the left, we have the Bengaluru Operational Map showing live camera status and traffic violation hotspots. On the right, our active AI recommendation feed identifies escalated regions and provides dispatch actions.
>
> If you look at the bottom-left sidebar, you'll see our global locator node spinning. It centers directly on India, indicating that the Bengaluru node at 12.97° North is online and actively monitoring network telemetry."*

---

## SCENE 2: NAVIGATING TO THE ANALYZE PAGE
**Visual**: Click on the **Analyze** tab in the sidebar (`http://localhost:8080/analyze`). Hover over the upload area.

**Voiceover Narration**:
> *"Now let's switch to the Analyze module. This is the heart of the DRISHTI processing pipeline. Here, officers can upload forensic evidence from non-automated feeds, edge cameras, or citizen reports to process them through our multi-model machine learning stack."*

---

## SCENE 3: UPLOADING THE EVIDENCE & DELAYED PIPELINE FLOW
**Visual**: Drag and drop or select `downloadingtest.jpg`. Watch the 6 pipeline steps light up green one-by-one:
1. `Frame Ingest` -> 2. `Vehicle Detection` -> 3. `Helmet Check` -> 4. `Plate OCR` -> 5. `Evidence Generation` -> 6. `Command Intelligence`.

**Voiceover Narration**:
> *"I will upload this image of a motorcycle rider. As soon as I drop the image, you can see our visual processing pipeline engaging in real-time. 
> 
> First, it ingests the frame. Then, the vehicle detection model localizes the motorcycle. Next, the helmet check model detects that the rider is non-compliant. The plate model localizes the registration plate, and the OCR engine reads the characters. 
> 
> Finally, we generate the cryptographically signed evidence package and run a Vahan query for vehicle verification."*

---

## SCENE 4: THE INFERENCE RESULTS & DETAILED ANALYSIS
**Visual**: Point to the **Annotated Image** frame showing the dual bounding boxes (Red box on motorcycle, Amber box on plate) and HUD text overlays.

**Voiceover Narration**:
> *"The analysis is complete, and the results are rendered.
> 
> Look at the annotated image. Our pipeline has drawn a red box around the motorcycle rider, identifying **Helmet Non-Compliance with 92.3% confidence**. 
> 
> Simultaneously, it has localized the licence plate with a yellow/amber box, reading **BH 02 DZ 4598**. 
> 
> In the top-left corner, we overlay critical metadata including the camera ID and junction location, and the bottom-right corner displays the overall confidence rating."*

---

## SCENE 5: VAHAN LOOKUP & PRIOR VIOLATION RECORDS
**Visual**: Scroll down to the **AI Violation Summary** card. Highlight the **Vehicle Owner Record** and hover over the **Prior Violation History** table. Point out the pulsing red **UNPAID** badges and the bold warning line.

**Voiceover Narration**:
> *"Below the image, the Vahan 4.0 database query pulls the vehicle owner record instantly. The motorcycle is registered to Rahul Devraj Nair, and the system immediately flags him as a **Repeat Offender**.
> 
> Here is the critical part: DRISHTI links directly to the local e-Challan database. We can see a complete list of prior violations for this vehicle. He has five prior challans—mostly for helmet non-compliance. 
> 
> Two of these challans are currently **unpaid**, as highlighted by the pulsing indicator flags. The system calculates a total outstanding fine of two thousand Rupees and alerts officers of pending legal action."*

---

## SCENE 6: COURT-ADMISSIBLE TELEMETRY & CONCLUSION
**Visual**: Hover over the **Processing Metadata** card showing the model version, pipeline details, legal act sections, and the Court Admissible seal.

**Voiceover Narration**:
> *"If we look at the telemetry card, the evidence is logged with a unique ID and timestamp. It is mapped under **Section 136A of the Motor Vehicles Amendment Act 2019**, classifying it as **Court Admissible evidence** grade.
> 
> This end-to-end integration of computer vision, owner lookup, and violation history makes DRISHTI a powerful tool for modern city traffic enforcement. 
> 
> Thank you."*
