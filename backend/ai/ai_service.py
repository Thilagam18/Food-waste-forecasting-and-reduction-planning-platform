import os
import json
import re
import google.generativeai as genai
from backend.ai.prompts import DISCLAIMER_TEXT, CATEGORY_SYSTEM_PROMPT, RECOMMENDATION_SYSTEM_PROMPT

class AIService:
    def __init__(self):
        self.api_key = os.environ.get('GEMINI_API_KEY', '')
        if self.api_key:
            try:
                genai.configure(api_key=self.api_key)
                self.model = genai.GenerativeModel('gemini-1.5-flash')
            except Exception as e:
                print(f"[AI] Gemini init warning: {e}")
                self.model = None
        else:
            self.model = None

    def analyze_health_issue(self, health_issue_text):
        """Categorize health issue into hospital department."""
        if not health_issue_text or not health_issue_text.strip():
            return {
                "category": "General Medicine",
                "confidence": 0.5,
                "reasoning": "Default category assigned due to empty health concern input.",
                "disclaimer": DISCLAIMER_TEXT
            }

        # Try Gemini API if key is available
        if self.model:
            try:
                prompt = f"{CATEGORY_SYSTEM_PROMPT}\n\nUser Symptoms: {health_issue_text}"
                response = self.model.generate_content(prompt)
                content = response.text.strip()
                # Clean codeblock wrappers if present
                if "```json" in content:
                    content = content.split("```json")[1].split("```")[0].strip()
                elif "```" in content:
                    content = content.split("```")[1].split("```")[0].strip()
                
                result = json.loads(content)
                result["disclaimer"] = DISCLAIMER_TEXT
                return result
            except Exception as e:
                print(f"[AI] Gemini API error, using fallback: {e}")

        # Heuristic / Rule-based NLP fallback engine
        return self._fallback_category_analysis(health_issue_text)

    def _fallback_category_analysis(self, text):
        text_lower = text.lower()
        
        rules = [
            (r'skin|itch|rash|acne|eczema|psoriasis|boil|mole', 'Dermatology', 0.9, 'Symptoms match skin and dermatological conditions.'),
            (r'heart|chest pain|palpitation|bp|blood pressure|cardiac|pulse', 'Cardiology', 0.95, 'Symptoms relate to cardiovascular health.'),
            (r'ear|nose|throat|sinus|hearing|tonsil|snore|cough|tinnitus', 'ENT', 0.88, 'Symptoms involve ear, nose, or throat.'),
            (r'bone|joint|fracture|knee|back pain|spine|sprain|arthritis|muscle', 'Orthopedics', 0.9, 'Symptoms indicate musculoskeletal or joint issue.'),
            (r'child|infant|baby|pediatric|toddler|fever in kid', 'Pediatrics', 0.92, 'Refers to child healthcare.'),
            (r'pregnancy|period|menstrual|ovary|uterus|gynec|vaginal', 'Gynecology', 0.95, 'Refers to female reproductive and gynecological health.'),
            (r'brain|headache|migraine|seizure|numbness|nerve|dizziness|paralysis', 'Neurology', 0.92, 'Symptoms suggest neurological system involvement.'),
            (r'eye|vision|blur|cataract|glaucoma|red eye', 'Ophthalmology', 0.9, 'Symptoms relate to eye and vision care.'),
            (r'asthma|breath|lung|bronchitis|wheezing|pulmonary', 'Pulmonology', 0.9, 'Symptoms relate to respiratory and lung conditions.'),
            (r'fever|cough|cold|fatigue|weakness|flu|stomach|headache|vomit', 'General Medicine', 0.85, 'Common systemic or general health symptoms.')
        ]

        for pattern, category, conf, reason in rules:
            if re.search(pattern, text_lower):
                return {
                    "category": category,
                    "confidence": conf,
                    "reasoning": f"{reason} (Fallback analysis engine)",
                    "disclaimer": DISCLAIMER_TEXT
                }

        return {
            "category": "General Medicine",
            "confidence": 0.75,
            "reasoning": "General health concern evaluation suggested for broad symptom spectrum.",
            "disclaimer": DISCLAIMER_TEXT
        }

    def recommend_hospitals(self, health_issue, department_name, hospital_candidates):
        """Recommend best hospital based on queue length, distance, and doctor availability."""
        if not hospital_candidates:
            return {
                "recommended_hospital_id": None,
                "recommended_hospital_name": "None Available",
                "match_score": 0,
                "reasoning": ["No matching hospitals found in system."],
                "disclaimer": DISCLAIMER_TEXT
            }

        # Try Gemini AI if available
        if self.model:
            try:
                candidates_json = json.dumps(hospital_candidates)
                prompt = f"{RECOMMENDATION_SYSTEM_PROMPT}\n\nSymptoms: {health_issue}\nDepartment: {department_name}\nHospital Candidates: {candidates_json}"
                response = self.model.generate_content(prompt)
                content = response.text.strip()
                if "```json" in content:
                    content = content.split("```json")[1].split("```")[0].strip()
                elif "```" in content:
                    content = content.split("```")[1].split("```")[0].strip()
                
                result = json.loads(content)
                result["disclaimer"] = DISCLAIMER_TEXT
                return result
            except Exception as e:
                print(f"[AI] Gemini recommendation API error, fallback used: {e}")

        # Heuristic scoring fallback algorithm
        scored = []
        for h in hospital_candidates:
            score = 100
            reasons = []

            # 1. Department match
            dept_names = [d.get('name') for d in h.get('departments', [])]
            if department_name in dept_names:
                score += 20
                reasons.append(f"Specialized {department_name} department available.")
            else:
                score -= 30

            # 2. Distance scoring (assuming max ~20km)
            dist = h.get('distance_km', 5.0)
            if dist <= 3.0:
                score += 25
                reasons.append(f"Close proximity ({dist:.1f} km away).")
            elif dist <= 8.0:
                score += 15
                reasons.append(f"Accessible distance ({dist:.1f} km).")
            else:
                score -= 10

            # 3. Queue wait time scoring
            wait = h.get('estimated_wait_mins', 20)
            if wait <= 15:
                score += 30
                reasons.append(f"Short waiting queue (~{wait} mins wait).")
            elif wait <= 35:
                score += 15
                reasons.append(f"Moderate waiting time (~{wait} mins wait).")
            else:
                score -= 15
                reasons.append(f"Higher queue congestion (~{wait} mins wait).")

            # 4. Doctor availability
            doc_count = h.get('available_doctors_count', 1)
            if doc_count > 0:
                reasons.append(f"{doc_count} doctor(s) currently available.")
            else:
                score -= 25

            final_match = max(40, min(98, score))
            scored.append({
                "hospital": h,
                "score": final_match,
                "reasons": reasons
            })

        scored.sort(key=lambda x: x["score"], reverse=True)
        top = scored[0]
        h_info = top["hospital"]

        return {
            "recommended_hospital_id": h_info["id"],
            "recommended_hospital_name": h_info["name"],
            "match_score": top["score"],
            "reasoning": top["reasons"],
            "disclaimer": DISCLAIMER_TEXT
        }

ai_service = AIService()
