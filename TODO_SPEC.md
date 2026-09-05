

📋 Full-Stack Biometric System - AI TODO SPECIFICATION
Project Context:
Develop an integrated biometric identification system supporting 5 biometric methods. The system includes a React frontend GUI, a Python FastAPI backend, a specific database schema, a pre-processing AI improvement, public dataset benchmarking, and live data collection/fusion capabilities.
Stack:


	Frontend: React (Vite), Tailwind CSS, Axios, react-webcam, react-media-recorder.

	Backend: Python 3.10+, FastAPI.

	Database: SQLite/PostgreSQL, SQLAlchemy.

Phase 1: Backend Setup & Database ORM (Python/FastAPI)
	[ ] TODO 1.1: Initialize a Python virtual environment in a backend/ folder and install requirements (fastapi, uvicorn, sqlalchemy, opencv-python, deepface, speechbrain, mediapipe, librosa, scikit-learn, python-multipart).

	[ ] TODO 1.2: Create database.py and implement the exact required schema using SQLAlchemy:


	Table Person_directory: random_id (PK, UUID), created_at (DateTime).

	Table Identity_map: random_id (PK, FK), national_id (String, UNIQUE), full_name (String), name_norm (String), created_at (DateTime).

	Table Raw_data: random_id (PK), capture (String), ext (String), sha256 (String), byte_size (Integer), created_at (DateTime), image_bytes (LargeBinary, nullable).

	Table Feature_vectors: random_id (PK), method (PK).

	Table Method_retrieval_vectors: random_id (PK), method (PK), vector_type (PK), vector_kind (String), dim (Integer), distance_metric (String), metadata_json (JSON), vector_512 (ARRAY/JSON), vector_768 (ARRAY/JSON), vector_blob (LargeBinary).

	[ ] TODO 1.3: Create CRUD utility functions (crud.py) to handle inserts and vector retrievals.

	[ ] TODO 1.4: Setup basic FastAPI main.py with CORS middleware enabled to allow requests from localhost:5173 (React Vite default port).

Phase 2: Biometric Feature Extraction Modules (Backend)
Instruction to AI: For each method, write a Python module that takes raw data (image/audio/video), cleans/crops it, and outputs a normalized feature vector (e.g., 512d).


	[ ] TODO 2.1 - Face Module (bio_face.py): Use DeepFace.represent() with model='Facenet512'. Output: 512d vector.

	[ ] TODO 2.2 - Voice Module (bio_voice.py): Use speechbrain/spkrec-ecapa-voxceleb. Pre-processing: Remove silence. Output: speaker embedding vector.

	[ ] TODO 2.3 - Palmprint Module (bio_palm.py): Use MediaPipe Hands to detect palm landmarks, crop the ROI, and pass through a pre-trained MobileNetV2 to extract features.

	[ ] TODO 2.4 - Gait Module (bio_gait.py): Use MediaPipe Pose on video files to extract joint coordinates over time, flattened into a fixed-size vector via PCA or temporal pooling.

	[ ] TODO 2.5 - Fingerprint Module (bio_fingerprint.py): Pre-processing: Grayscale, CLAHE, Gabor filter. Pass through a lightweight CNN for vector extraction.

Phase 3: The "Unique AI Improvement" (Backend QA Filter)
	[ ] TODO 3.1 - Implement AI Quality Assessment Filter (qa_filter.py):


	For Images: Calculate Laplacian variance (Blur detection). Fast reject if variance < threshold.

	For Audio: Calculate SNR (Signal-to-Noise Ratio). Fast reject if too noisy.

	Goal: Improve response time and accuracy by blocking bad captures before heavy ML processing.

Phase 4: REST API Endpoints (Backend)
	[ ] TODO 4.1: Create POST /enroll: Accepts user details and 5 multipart form files (images/audio/video). Runs QA filter -> Extracts 5 vectors -> Saves to DB.

	[ ] TODO 4.2: Create POST /verify/single: Accepts method type and 1 file. Runs QA filter -> Extracts vector -> Compares using Cosine Similarity against DB -> Returns Match/No Match and Score.

	[ ] TODO 4.3: Create POST /verify/fusion: Accepts Face, Voice, and Palm files.


	Sub-task A: Implement Majority Voting logic (2 out of 3).

	Sub-task B: Implement Weighted Vector Fusion (V_fused=[w_1 V_f,w_2 V_v,w_3 V_p ]) and distance calculation.

Phase 5: Frontend React Setup & Architecture
	[ ] TODO 5.1: Initialize React app in frontend/ using Vite (npm create vite@latest . --template react) and install dependencies (tailwindcss, axios, react-router-dom, react-webcam, react-media-recorder, lucide-react).

	[ ] TODO 5.2: Setup Tailwind CSS configuration and wrap the app in a nice layout with a Sidebar navigation (Enrollment, Single Verification, Fusion Verification, Dashboard).

Phase 6: React Frontend - Enrollment Flow
	[ ] TODO 6.1: Build Enrollment.jsx. Include a form for National ID and Full Name.

	[ ] TODO 6.2: Create a Capture component using react-webcam for taking Face, Palm, and Fingerprint photos directly from the browser.

	[ ] TODO 6.3: Create an Audio component using react-media-recorder to record Voice directly from the browser.

	[ ] TODO 6.4: Create a File Upload component for the Gait video.

	[ ] TODO 6.5: On submit, append all files to a FormData object and POST to /enroll. Display success/error toasts based on the Backend QA Filter response.

Phase 7: React Frontend - Verification & Fusion Flows
	[ ] TODO 7.1: Build SingleVerification.jsx. Let the user select a method from a dropdown, capture the corresponding media, POST to /verify/single, and display a visual "Match / No Match" card with the similarity score.

	[ ] TODO 7.2: Build FusionVerification.jsx. Force the user to capture Face, Voice, and Palm sequentially. POST to /verify/fusion and display a split result screen: "Majority Vote Result" vs "Vector Fusion Result".

	[ ] TODO 7.3: Build Dashboard.jsx. Fetch and display a data table of all enrolled users from the database to track the 20-volunteer requirement.

Phase 8: Public Dataset Benchmarking (FULLY AUTOMATED)
CRITICAL INSTRUCTION TO AI: You MUST write standalone Python scripts that AUTOMATICALLY fetch the required datasets. The user WILL NOT manually download any ZIP files, will not navigate to Kaggle, and will not manually create folders. Your code must handle everything autonomously upon execution.
Rules for Data Fetching:
	If a dataset is available via a library (like sklearn.datasets.fetch_lfw_pairs or Hugging Face datasets), use it.
	If it is NOT natively available via a library, your script MUST use requests or urllib to download a public dataset ZIP from a direct URL (e.g., raw GitHub links) to a temporary directory using Python's tempfile module. Extract it, process 500 sample pairs, and then automatically clean up/delete the temporary files.
	[ ] TODO 8.1 - Face (eval_face.py): Use sklearn.datasets.fetch_lfw_pairs(subset='test') to fetch 500 pairs automatically in the background. Calculate Accuracy, FAR, FRR, EER.
	[ ] TODO 8.2 - Voice (eval_voice.py): Use the Hugging Face datasets library to load an open audio dataset automatically (e.g., a subset of VoxCeleb or PolyAI/minds14). Calculate metrics for 500 pairs.
	[ ] TODO 8.3 - Palmprint (eval_palm.py): Write Python code that uses requests and zipfile to autonomously download a public contactless palmprint dataset to a tempfile.TemporaryDirectory(), evaluate 500 cases, and automatically clean up the files when done.
	[ ] TODO 8.4 - Gait (eval_gait.py): Write Python code that autonomously downloads a public Gait dataset (videos or silhouettes) to a temporary directory, evaluates 500 cases, and cleans up.
	[ ] TODO 8.5 - Fingerprint (eval_finger.py): Write Python code that autonomously downloads a public fingerprint dataset (like SOCOFing) to a temporary directory, evaluates 500 cases, and cleans up.
	[ ] TODO 8.6: Aggregate all results and save them to a single output file: backend/benchmarks/consolidated_metrics.json.





Phase 9: Academic Deliverables Generation (Strict Requirements)
Instruction to AI: The final project requires a specific presentation and a comprehensive Word document. Generate their content exactly as follows:


	[ ] TODO 9.1 - Literature Review: Find a recent paper (2024-2026) on "Contactless Palmprint Recognition". Summarize the experiments, results, conclusions, and future work. Extract exactly 3 direct quotes from this paper.

	[ ] TODO 9.2 - Generate the 5-Slide Presentation Content:


	Slide 1: Student Name (שון ברקוביץ), Names of the 3 fused biometric methods (Face, Voice, Palmprint), Paper Title + Link, and a representative image from the paper.

	Slide 2: Description of the dataset experiments (500 cases per method from Phase 8) and the findings (Accuracy, EER).

	Slide 3: Introduction of the chosen paper and a description of its proposed solution.

	Slide 4: The 3 direct quotes extracted from the paper.

	Slide 5: Summary of the live 20-volunteers experiment, the Unique AI QA Filter results, and conclusions regarding the fusion methods.

	[ ] TODO 9.3 - Generate the Final Word Document Structure:


	Generate a template document that includes sections for:


	Screenshots of the raw collected data (Camera/Video inputs).

	Snippets of the extracted feature vectors (e.g., printed arrays of the 512d vectors).

	The Literature Review from TODO 9.1.

	Code explanation highlighting the "Unique Improvement" (The AI QA Filter).

	The DB Schema implementation details.

	Results comparing individual method accuracy vs. Fusion accuracy (Majority Vote vs. Weighted Vector).


"This is the spec for my full-stack Biometrics assignment. We are using React and FastAPI.

