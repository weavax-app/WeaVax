import { fsActions } from './firebase-sync.js?v=5';

const BASE_IMG = "https://lyfta.app/images/exercises";

export const EXERCISE_CATALOG = [
    { id: 1, name: "Press de banca plano con barra", muscleGroup: "Pecho", equipment: "Barra", img: `${BASE_IMG}/00251101.png` },
    { id: 2, name: "Press de banca inclinado con barra", muscleGroup: "Pecho", equipment: "Barra", img: `${BASE_IMG}/00471101.png` },
    { id: 4, name: "Press de banca plano con mancuernas", muscleGroup: "Pecho", equipment: "Mancuerna", img: `${BASE_IMG}/02891101.png` },
    { id: 5, name: "Press de banca inclinado con mancuernas", muscleGroup: "Pecho", equipment: "Mancuerna", img: `${BASE_IMG}/03141101.png` },
    { id: 6, name: "Fondos en paralelas para pecho", muscleGroup: "Pecho", equipment: "Corporal", img: `${BASE_IMG}/02511101.png` },
    { id: 7, name: "Cruces en polea alta", muscleGroup: "Pecho", equipment: "Polea", img: `${BASE_IMG}/01791101.png` },
    { id: 9, name: "Pec Deck en máquina", muscleGroup: "Pecho", equipment: "Máquina", img: `${BASE_IMG}/00191101.png` },
    { id: 10, name: "Flexiones de pecho clásicas", muscleGroup: "Pecho", equipment: "Corporal", img: `${BASE_IMG}/06621101.png` },
    { id: 11, name: "Peso muerto convencional", muscleGroup: "Espalda", equipment: "Barra", img: `${BASE_IMG}/00321101.png` },
    { id: 12, name: "Dominadas pronas asistidas", muscleGroup: "Espalda", equipment: "Máquina", img: `${BASE_IMG}/00151101.png` },
    { id: 13, name: "Remo con barra 90 grados", muscleGroup: "Espalda", equipment: "Barra", img: `${BASE_IMG}/00271101.png` },
    { id: 14, name: "Jalón al pecho agarre ancho en polea", muscleGroup: "Espalda", equipment: "Polea", img: `${BASE_IMG}/07101101.png` },
    { id: 15, name: "Remo unilateral con mancuerna", muscleGroup: "Espalda", equipment: "Mancuerna", img: `${BASE_IMG}/02921101.png` },
    { id: 16, name: "Remo en barra T", muscleGroup: "Espalda", equipment: "Barra", img: `${BASE_IMG}/08471101.png` },
    { id: 17, name: "Jalón agarre cerrado supino", muscleGroup: "Espalda", equipment: "Polea", img: `${BASE_IMG}/02531101.png` },
    { id: 18, name: "Pullover en polea alta con cuerda", muscleGroup: "Espalda", equipment: "Polea", img: `${BASE_IMG}/02381101.png` },
    { id: 19, name: "Encogimientos de hombros con barra", muscleGroup: "Espalda", equipment: "Barra", img: `${BASE_IMG}/00951101.png` },
    { id: 20, name: "Remo invertido en barra alta", muscleGroup: "Espalda", equipment: "Corporal", img: `${BASE_IMG}/05021101.png` },
    { id: 21, name: "Sentadilla trasera con barra (High Bar)", muscleGroup: "Cuádriceps", equipment: "Barra", img: `${BASE_IMG}/00431101.png` },
    { id: 22, name: "Sentadilla frontal con barra", muscleGroup: "Cuádriceps", equipment: "Barra", img: `${BASE_IMG}/00421101.png` },
    { id: 23, name: "Prensa de piernas 45 grados inclinada", muscleGroup: "Cuádriceps", equipment: "Máquina", img: `${BASE_IMG}/05811101.png` },
    { id: 24, name: "Zancadas caminando con mancuernas", muscleGroup: "Cuádriceps", equipment: "Mancuerna", img: `${BASE_IMG}/03061101.png` },
    { id: 25, name: "Sentadilla búlgara con mancuernas", muscleGroup: "Cuádriceps", equipment: "Mancuerna", img: `${BASE_IMG}/22901101.png` },
    { id: 26, name: "Extensión de cuádriceps en máquina", muscleGroup: "Cuádriceps", equipment: "Máquina", img: `${BASE_IMG}/05851101.png` },
    { id: 27, name: "Sentadilla Hack en máquina", muscleGroup: "Cuádriceps", equipment: "Máquina", img: `${BASE_IMG}/04951101.png` },
    { id: 28, name: "Sentadilla Goblet con kettlebell", muscleGroup: "Cuádriceps", equipment: "Mancuerna", img: `${BASE_IMG}/17601101.png` },
    { id: 29, name: "Zancada búlgara corporal", muscleGroup: "Cuádriceps", equipment: "Corporal", img: `${BASE_IMG}/04101101.png` },
    { id: 31, name: "Peso muerto rumano con barra", muscleGroup: "Isquiosurales/Glúteos", equipment: "Barra", img: `${BASE_IMG}/00851101.png` },
    { id: 32, name: "Hip Thrust con barra en banco", muscleGroup: "Isquiosurales/Glúteos", equipment: "Barra", img: `${BASE_IMG}/10551101.png` },
    { id: 33, name: "Curl femoral tumbado en máquina", muscleGroup: "Isquiosurales/Glúteos", equipment: "Máquina", img: `${BASE_IMG}/05991101.png` },
    { id: 34, name: "Peso muerto piernas rígidas con mancuernas", muscleGroup: "Isquiosurales/Glúteos", equipment: "Mancuerna", img: `${BASE_IMG}/08141101.png` },
    { id: 35, name: "Puente de glúteos a una pierna", muscleGroup: "Isquiosurales/Glúteos", equipment: "Corporal", img: `${BASE_IMG}/04751101.png` },
    { id: 36, name: "Abducción de cadera en polea baja", muscleGroup: "Isquiosurales/Glúteos", equipment: "Polea", img: `${BASE_IMG}/05981101.png` },
    { id: 37, name: "Patada de glúteo en polea baja", muscleGroup: "Isquiosurales/Glúteos", equipment: "Polea", img: `${BASE_IMG}/04731101.png` },
    { id: 40, name: "Peso muerto sumo con barra", muscleGroup: "Isquiosurales/Glúteos", equipment: "Barra", img: `${BASE_IMG}/01181101.png` },
    { id: 41, name: "Press militar de pie con barra", muscleGroup: "Hombros", equipment: "Barra", img: `${BASE_IMG}/00791101.png` },
    { id: 42, name: "Press Arnold sentado con mancuernas", muscleGroup: "Hombros", equipment: "Mancuerna", img: `${BASE_IMG}/00111101.png` },
    { id: 43, name: "Elevaciones laterales con mancuernas", muscleGroup: "Hombros", equipment: "Mancuerna", img: `${BASE_IMG}/01781101.png` },
    { id: 44, name: "Pájaros para deltoides posterior mancuernas", muscleGroup: "Hombros", equipment: "Mancuerna", img: `${BASE_IMG}/03731101.png` },
    { id: 45, name: "Face Pull en polea con cuerda", muscleGroup: "Hombros", equipment: "Polea", img: `${BASE_IMG}/01801101.png` },
    { id: 46, name: "Elevación lateral unilateral polea", muscleGroup: "Hombros", equipment: "Polea", img: `${BASE_IMG}/01681101.png` },
    { id: 50, name: "Push Press con barra de pie", muscleGroup: "Hombros", equipment: "Barra", img: `${BASE_IMG}/00791101.png` },
    { id: 51, name: "Curl de bíceps con barra Z de pie", muscleGroup: "Bíceps", equipment: "Barra", img: `${BASE_IMG}/00511101.png` },
    { id: 52, name: "Curl alterno con mancuernas de pie", muscleGroup: "Bíceps", equipment: "Mancuerna", img: `${BASE_IMG}/01571101.png` },
    { id: 53, name: "Curl martillo con mancuernas de pie", muscleGroup: "Bíceps", equipment: "Mancuerna", img: `${BASE_IMG}/03121101.png` },
    { id: 55, name: "Curl bayesiano unilateral en polea", muscleGroup: "Bíceps", equipment: "Polea", img: `${BASE_IMG}/16661101.png` },
    { id: 56, name: "Dominadas supinas corporales", muscleGroup: "Bíceps", equipment: "Corporal", img: `${BASE_IMG}/00151101.png` },
    { id: 61, name: "Press francés con barra Z tumbado", muscleGroup: "Tríceps", equipment: "Barra", img: `${BASE_IMG}/00601101.png` },
    { id: 62, name: "Jalón de tríceps en polea alta con cuerda", muscleGroup: "Tríceps", equipment: "Polea", img: `${BASE_IMG}/02411101.png` },
    { id: 63, name: "Press de banca agarre estrecho", muscleGroup: "Tríceps", equipment: "Barra", img: `${BASE_IMG}/00301101.png` },
    { id: 65, name: "Fondos en paralelas para tríceps", muscleGroup: "Tríceps", equipment: "Corporal", img: `${BASE_IMG}/02511101.png` },
    { id: 71, name: "Plancha frontal clásica", muscleGroup: "Core", equipment: "Corporal", img: `${BASE_IMG}/04651101.png` },
    { id: 72, name: "Elevación de piernas colgado", muscleGroup: "Core", equipment: "Corporal", img: `${BASE_IMG}/06541101.png` },
    { id: 73, name: "Rueda abdominal (Ab Wheel)", muscleGroup: "Core", equipment: "Máquina", img: `${BASE_IMG}/00031101.png` },
    { id: 74, name: "Crunch abdominal con peso", muscleGroup: "Core", equipment: "Mancuerna", img: `${BASE_IMG}/00011101.png` },
    { id: 75, name: "Giros rusos (Russian Twists) con disco", muscleGroup: "Core", equipment: "Mancuerna", img: `${BASE_IMG}/06871101.png` },
    { id: 78, name: "Plancha lateral dinámica", muscleGroup: "Core", equipment: "Corporal", img: `${BASE_IMG}/07221101.png` },
    { id: 79, name: "Dragon Flag tuck asistido", muscleGroup: "Core", equipment: "Corporal", img: `${BASE_IMG}/06541101.png` },
    { id: 81, name: "Elevación de talones de pie en máquina", muscleGroup: "Pantorrillas", equipment: "Máquina", img: `${BASE_IMG}/04171101.png` },
    { id: 82, name: "Elevación de talones sentado (Sóleo)", muscleGroup: "Pantorrillas", equipment: "Máquina", img: `${BASE_IMG}/08161101.png` }
];

export function getExById(id) {
    return EXERCISE_CATALOG.find(e => Number(e.id) === Number(id)) || EXERCISE_CATALOG[0];
}

function mkDay(dayNumber, dayName, dayImageUri, exTuples) {
    return {
        dayNumber,
        dayName,
        dayImageUri,
        exercises: exTuples.map((t, idx) => {
            const cat = getExById(t[0]);
            return {
                id: idx + 1,
                exerciseId: cat.id,
                exerciseName: cat.name,
                muscleGroup: cat.muscleGroup,
                equipment: cat.equipment,
                imageUri: cat.img,
                orderIndex: idx,
                targetSets: t[1],
                targetRepsRange: t[2],
                restSeconds: t[3]
            };
        })
    };
}

const pPush = "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=800";
const pPull = "https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=800";
const pLegs = "https://images.unsplash.com/photo-1599058917212-d750089bc07e?w=800";
const pFb   = "https://images.unsplash.com/photo-1579758629938-03607ccdbaba?w=800";

export const WEAVAX_30_TEMPLATES = [
    { id: 1, name: "Push / Pull / Legs Clásico", categoryGroup: "PPL (Push Pull Legs)", focusCategory: "Hipertrofia", targetDaysPerWeek: 6, estimatedDurationMinutes: 65, isSystemTemplate: true, imageUri: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800", description: "Estructura de 6 días con doble frecuencia semanal. Máxima síntesis proteica y balance muscular.", days: [
        mkDay(1, "Push A (Empuje)", pPush, [[1,4,"6-8",120],[41,3,"8-10",90],[5,3,"8-12",90],[43,4,"12-15",60],[61,3,"10-12",60]]),
        mkDay(2, "Pull A (Tracción)", pPull, [[11,3,"5",150],[14,4,"8-10",90],[13,4,"8-10",90],[45,4,"12-15",60],[51,3,"10-12",60]]),
        mkDay(3, "Legs A (Pierna)", pLegs, [[21,4,"6-8",120],[31,3,"8-10",90],[23,3,"10-12",90],[33,3,"12-15",60],[81,4,"12-15",60]]),
        mkDay(4, "Push B (Inclinado / Tríceps)", pPush, [[5,4,"8-10",90],[42,3,"10-12",90],[6,3,"8-12",90],[43,4,"12-15",60],[62,3,"12-15",60]]),
        mkDay(5, "Pull B (Densidad)", pPull, [[15,4,"8-10",75],[16,3,"10-12",75],[17,3,"10-12",75],[44,4,"12-15",60],[53,3,"10-12",60]]),
        mkDay(6, "Legs B (Glúteo / Femoral)", pLegs, [[32,4,"8-10",90],[25,3,"10-12",90],[34,3,"10-12",75],[26,3,"12-15",60],[72,3,"12-15",60]])
    ]},
    { id: 2, name: "PPL Hipertrofia Avanzada", categoryGroup: "PPL (Push Pull Legs)", focusCategory: "Hipertrofia", targetDaysPerWeek: 6, estimatedDurationMinutes: 70, isSystemTemplate: true, imageUri: "https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=800", description: "Enfoque en volumen alto de trabajo, congestión muscular y técnicas avanzadas.", days: [
        mkDay(1, "Día 1: Push Power", pPush, [[1,5,"5",120],[4,4,"8-10",90],[41,4,"6-8",90],[63,4,"8-10",75]]),
        mkDay(2, "Día 2: Pull Power", pPull, [[11,4,"4-6",150],[13,4,"6-8",90],[14,4,"8-10",75],[51,4,"8-10",60]]),
        mkDay(3, "Día 3: Legs Heavy", pLegs, [[21,5,"5",150],[31,4,"6-8",100],[23,4,"10-12",90],[81,4,"12-15",60]])
    ]},
    { id: 3, name: "Arnold Split Clásico", categoryGroup: "PPL (Push Pull Legs)", focusCategory: "Hipertrofia", targetDaysPerWeek: 6, estimatedDurationMinutes: 75, isSystemTemplate: true, imageUri: "https://images.unsplash.com/photo-1526506118085-60ce8714f8c5?w=800", description: "La icónica división de Arnold combinando músculos antagonistas: Pecho/Espalda, Hombro/Brazo y Pierna.", days: [
        mkDay(1, "Día 1: Pecho y Espalda", pPush, [[1,4,"8-10",90],[14,4,"8-10",90],[5,4,"10-12",75],[15,4,"10-12",75]]),
        mkDay(2, "Día 2: Hombros y Brazos", pPull, [[41,4,"8-10",90],[43,4,"12-15",60],[51,4,"10-12",60],[61,4,"10-12",60]]),
        mkDay(3, "Día 3: Pierna Completa", pLegs, [[21,4,"8-10",120],[31,4,"8-10",90],[23,3,"12-15",75],[81,4,"15-20",60]])
    ]},
    { id: 4, name: "PPL Principiante 3 Días", categoryGroup: "PPL (Push Pull Legs)", focusCategory: "Hipertrofia", targetDaysPerWeek: 3, estimatedDurationMinutes: 50, isSystemTemplate: true, imageUri: "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=800", description: "1 día de Empuje, 1 de Tracción y 1 de Pierna con ejercicios fundamentales.", days: [
        mkDay(1, "Día 1: Empuje Básico", pPush, [[1,3,"8-10",90],[43,3,"12-15",60],[62,3,"12-15",60]]),
        mkDay(2, "Día 2: Tracción Básica", pPull, [[14,3,"8-10",90],[15,3,"10-12",75],[52,3,"10-12",60]]),
        mkDay(3, "Día 3: Pierna Básica", pLegs, [[23,4,"10-12",90],[33,3,"12-15",60],[71,3,"45s",60]])
    ]},
    { id: 5, name: "PPL Rest-Pause & Dropsets", categoryGroup: "PPL (Push Pull Legs)", focusCategory: "Hipertrofia", targetDaysPerWeek: 5, estimatedDurationMinutes: 60, isSystemTemplate: true, imageUri: "https://images.unsplash.com/photo-1584735935682-2f2b69dff9d2?w=800", description: "Intensidad máxima con técnicas de extensión de series para romper estancamientos.", days: [
        mkDay(1, "Día 1: Push Intensivo", pPush, [[4,4,"8-10",75],[7,4,"12-15",60],[46,4,"15",45],[62,4,"12-15",45]]),
        mkDay(2, "Día 2: Pull Intensivo", pPull, [[14,4,"8-10",75],[16,4,"10-12",60],[55,4,"12-15",45]])
    ]},
    { id: 6, name: "Upper / Lower (Torso / Pierna) - 4 Días", categoryGroup: "Torso / Pierna", focusCategory: "Hipertrofia", targetDaysPerWeek: 4, estimatedDurationMinutes: 60, isSystemTemplate: true, imageUri: pPull, description: "División balanceada de 4 días dividida en 2 entrenamientos de torso y 2 de pierna.", days: [
        mkDay(1, "Día 1: Torso A (Fuerza)", pPush, [[1,4,"6-8",120],[13,4,"6-8",90],[41,3,"8-10",90],[51,3,"10-12",60]]),
        mkDay(2, "Día 2: Pierna A (Cuádriceps)", pLegs, [[21,4,"6-8",120],[31,4,"8-10",90],[23,3,"10-12",90],[81,4,"12-15",60]]),
        mkDay(3, "Día 3: Torso B (Hipertrofia)", pPush, [[5,4,"8-10",90],[15,4,"8-10",75],[43,4,"12-15",60],[62,3,"12-15",60]]),
        mkDay(4, "Día 4: Pierna B (Glúteos y Femoral)", pLegs, [[32,4,"8-10",90],[25,3,"10-12",90],[33,3,"12-15",60],[72,3,"12-15",60]])
    ]},
    { id: 7, name: "Torso / Pierna Fuerza Pura", categoryGroup: "Torso / Pierna", focusCategory: "Fuerza", targetDaysPerWeek: 4, estimatedDurationMinutes: 65, isSystemTemplate: true, imageUri: "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=800", description: "Progresión de sobrecarga lineal en banca, sentadilla, peso muerto y press militar.", days: [
        mkDay(1, "Día 1: Torso Pesado", pPush, [[1,5,"3-5",150],[13,5,"5",120],[41,4,"5",120]]),
        mkDay(2, "Día 2: Pierna Pesada", pLegs, [[21,5,"3-5",180],[11,3,"3-5",180],[71,3,"60s",60]])
    ]},
    { id: 8, name: "Torso / Pierna Atlético & Potencia", categoryGroup: "Torso / Pierna", focusCategory: "Resistencia", targetDaysPerWeek: 4, estimatedDurationMinutes: 55, isSystemTemplate: true, imageUri: "https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?w=800", description: "Enfoque deportivo para mejorar velocidad, salto vertical y potencia explosiva.", days: [
        mkDay(1, "Día 1: Torso Potencia", pPush, [[50,4,"4-6",90],[6,4,"8-10",75],[20,4,"10-12",60]]),
        mkDay(2, "Día 2: Pierna Potencia", pLegs, [[22,4,"5",120],[32,4,"8",90],[24,3,"12",60]])
    ]},
    { id: 9, name: "Torso / Pierna Minimalista", categoryGroup: "Torso / Pierna", focusCategory: "Hipertrofia", targetDaysPerWeek: 3, estimatedDurationMinutes: 45, isSystemTemplate: true, imageUri: "https://images.unsplash.com/photo-1598971639058-fab3c3109a00?w=800", description: "Para agendas ocupadas que entrenan 3 días con rotación Torso/Pierna.", days: [
        mkDay(1, "Día 1: Torso Express", pPush, [[1,4,"8-10",90],[14,4,"8-10",75],[43,3,"12",60]]),
        mkDay(2, "Día 2: Pierna Express", pLegs, [[21,4,"8-10",120],[31,3,"10",90]])
    ]},
    { id: 10, name: "Full Body Fuerza Compuesta - 3 Días", categoryGroup: "Full Body", focusCategory: "Fuerza", targetDaysPerWeek: 3, estimatedDurationMinutes: 55, isSystemTemplate: true, imageUri: pFb, description: "Cuerpo completo de 3 sesiones semanales enfocado en los grandes levantamientos.", days: [
        mkDay(1, "Día 1: Full Body A", pFb, [[21,4,"5",150],[1,4,"5",120],[13,3,"6-8",90]]),
        mkDay(2, "Día 2: Full Body B", pFb, [[11,3,"5",150],[5,4,"8-10",90],[14,4,"8-10",90]]),
        mkDay(3, "Día 3: Full Body C", pFb, [[21,3,"8-10",120],[6,3,"8-12",90],[41,3,"6-8",90]])
    ]},
    { id: 11, name: "Full Body Alta Frecuencia (HFT)", categoryGroup: "Full Body", focusCategory: "Hipertrofia", targetDaysPerWeek: 4, estimatedDurationMinutes: 50, isSystemTemplate: true, imageUri: "https://images.unsplash.com/photo-1534367507873-d2d7e24c797f?w=800", description: "4 sesiones de cuerpo completo con volumen moderado por sesión.", days: [
        mkDay(1, "Día 1: FB Cuádriceps y Pecho", pFb, [[21,3,"8-10",90],[1,3,"8-10",90],[15,3,"10-12",60]]),
        mkDay(2, "Día 2: FB Posterior y Hombros", pFb, [[31,3,"8-10",90],[41,3,"8-10",90],[14,3,"10-12",60]])
    ]},
    { id: 12, name: "Full Body Peso Corporal & Calistenia", categoryGroup: "Full Body", focusCategory: "Calistenia", targetDaysPerWeek: 3, estimatedDurationMinutes: 45, isSystemTemplate: true, imageUri: "https://images.unsplash.com/photo-1549060279-7e168fcee0c2?w=800", description: "Domina tu propio peso corporal con flexiones, dominadas, fondos y zancadas.", days: [
        mkDay(1, "Día 1: Calistenia Fuerza", pPush, [[6,4,"8-12",90],[56,4,"6-10",90],[29,3,"12-15",60],[71,3,"60s",60]])
    ]},
    { id: 13, name: "Full Body Kettlebell & Mancuernas", categoryGroup: "Full Body", focusCategory: "Resistencia", targetDaysPerWeek: 3, estimatedDurationMinutes: 40, isSystemTemplate: true, imageUri: "https://images.unsplash.com/photo-1574680096145-d05b474e2155?w=800", description: "Entrenamiento dinámico para entrenar en casa o en zonas de peso libre.", days: [
        mkDay(1, "Día 1: Circuito Express", pFb, [[28,4,"12-15",60],[4,4,"10-12",60],[15,4,"10-12",60],[75,3,"20",45]])
    ]},
    { id: 14, name: "Glúteos de Acero & Isquios", categoryGroup: "Énfasis Específico", focusCategory: "Hipertrofia", targetDaysPerWeek: 4, estimatedDurationMinutes: 60, isSystemTemplate: true, imageUri: "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=800", description: "Especialización en glúteos e isquiosurales con Hip Thrust, peso muerto y poleas.", days: [
        mkDay(1, "Día 1: Glúteo Pesado", pLegs, [[32,4,"8-10",90],[40,4,"6-8",100],[37,3,"15",45]]),
        mkDay(2, "Día 2: Isquios & Forma", pLegs, [[31,4,"8-10",90],[33,4,"12-15",60],[36,3,"15",45]])
    ]},
    { id: 15, name: "Pecho & Brazos Titánicos", categoryGroup: "Énfasis Específico", focusCategory: "Hipertrofia", targetDaysPerWeek: 4, estimatedDurationMinutes: 60, isSystemTemplate: true, imageUri: "https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=800", description: "Enfoque hipertrófico prioritario para pectorales, bíceps y tríceps.", days: [
        mkDay(1, "Día 1: Pecho Prioridad", pPush, [[1,4,"6-8",120],[5,4,"8-10",90],[9,3,"12-15",60]]),
        mkDay(2, "Día 2: Brazos Explosivos", pPull, [[51,4,"8-10",60],[61,4,"8-10",60],[53,3,"10-12",60],[62,3,"12-15",60]])
    ]},
    { id: 16, name: "Espalda en V & Densidad Dorsal", categoryGroup: "Énfasis Específico", focusCategory: "Hipertrofia", targetDaysPerWeek: 4, estimatedDurationMinutes: 60, isSystemTemplate: true, imageUri: pPull, description: "Amplitud y grosor de espalda con dominadas, jalones anchos y remos pesados.", days: [
        mkDay(1, "Día 1: Amplitud V-Taper", pPull, [[14,4,"8-10",90],[18,4,"12-15",60],[12,3,"8-10",75]]),
        mkDay(2, "Día 2: Densidad y Grosor", pPull, [[13,4,"6-8",90],[16,4,"8-10",75],[19,4,"12",60]])
    ]},
    { id: 17, name: "Hombros 3D & Core Blindado", categoryGroup: "Énfasis Específico", focusCategory: "Hipertrofia", targetDaysPerWeek: 4, estimatedDurationMinutes: 55, isSystemTemplate: true, imageUri: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800", description: "Desarrollo de las 3 cabezas del deltoides combinado con abdomen de acero.", days: [
        mkDay(1, "Día 1: Deltoides Lateral & Anterior", pPush, [[41,4,"8-10",90],[43,5,"12-15",60],[72,4,"12-15",60]]),
        mkDay(2, "Día 2: Deltoides Posterior & Core", pPull, [[45,4,"15",60],[44,4,"15",60],[73,3,"12",60]])
    ]},
    { id: 18, name: "Street Workout: Dominadas y Fondos", categoryGroup: "Calistenia y Funcional", focusCategory: "Calistenia", targetDaysPerWeek: 4, estimatedDurationMinutes: 55, isSystemTemplate: true, imageUri: "https://images.unsplash.com/photo-1549060279-7e168fcee0c2?w=800", description: "Fuerza calisténica pura para aumentar marcas de dominadas, fondos y control corporal.", days: [
        mkDay(1, "Día 1: Empuje Calisténico", pPush, [[6,5,"10-12",90],[10,4,"15-20",60],[65,3,"12",60]]),
        mkDay(2, "Día 2: Tracción Calisténica", pPull, [[56,5,"8-10",90],[20,4,"10-12",60],[72,4,"12-15",60]])
    ]},
    { id: 19, name: "Calistenia Pro: Fuerza Isométrica", categoryGroup: "Calistenia y Funcional", focusCategory: "Calistenia", targetDaysPerWeek: 4, estimatedDurationMinutes: 50, isSystemTemplate: true, imageUri: pPush, description: "Progresiones de Front Lever, Dragon Flag y estabilidad escapular.", days: [
        mkDay(1, "Día 1: Bloqueo Escapular", pPull, [[20,4,"10",75],[79,4,"6-8",90],[71,4,"60s",60]])
    ]},
    { id: 20, name: "Movilidad, Core y Postura", categoryGroup: "Calistenia y Funcional", focusCategory: "Funcional", targetDaysPerWeek: 3, estimatedDurationMinutes: 40, isSystemTemplate: true, imageUri: "https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?w=800", description: "Mejora alineación corporal, previene lesiones lumbares y fortalece el core.", days: [
        mkDay(1, "Día 1: Estabilidad Central", pFb, [[71,4,"60s",45],[78,3,"45s",45],[35,3,"15",45]])
    ]},
    { id: 21, name: "Baki Hanma: Espalda del Demonio", categoryGroup: "Anime Aesthetic & Superhero", focusCategory: "Hipertrofia", targetDaysPerWeek: 4, estimatedDurationMinutes: 65, isSystemTemplate: true, imageUri: "https://images.unsplash.com/photo-1563089145-599997674d42?w=800", description: "Desbloquea el rostro del demonio en tu espalda con remo pesado, dominadas y trapecios estilo Hanma.", days: [
        mkDay(1, "Día 1: Despertar del Demonio", pPull, [[11,4,"5",150],[13,4,"6-8",90],[19,4,"10-12",60]]),
        mkDay(2, "Día 2: Alas de Ogre", pPull, [[14,4,"8-10",90],[16,4,"8-10",75],[45,4,"12-15",60]])
    ]},
    { id: 22, name: "Goku Ultra Instinct: Sayayin", categoryGroup: "Anime Aesthetic & Superhero", focusCategory: "Fuerza", targetDaysPerWeek: 5, estimatedDurationMinutes: 65, isSystemTemplate: true, imageUri: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800", description: "Fuerza explosiva, velocidad y resistencia sobrehumana inspirada en la Cámara del Tiempo.", days: [
        mkDay(1, "Día 1: Gravedad x100 Empuje", pPush, [[1,4,"5",120],[50,4,"6",90],[6,3,"10",75]]),
        mkDay(2, "Día 2: Kaioken Piernas", pLegs, [[21,5,"5",150],[23,4,"10",90],[72,4,"12",60]])
    ]},
    { id: 23, name: "Solo Leveling: Shadow Monarch", categoryGroup: "Anime Aesthetic & Superhero", focusCategory: "Hipertrofia", targetDaysPerWeek: 4, estimatedDurationMinutes: 60, isSystemTemplate: true, imageUri: "https://images.unsplash.com/photo-1578632767115-351597cf2477?w=800", description: "Sube de rango desde cazador E hasta Monarca de las Sombras con V-Taper extremo.", days: [
        mkDay(1, "Día 1: Dungeon Strike (Torso)", pPush, [[5,4,"8-10",90],[14,4,"8-10",90],[43,5,"12-15",45]]),
        mkDay(2, "Día 2: Arise (Pierna & Core)", pLegs, [[21,4,"6-8",120],[31,4,"8-10",90],[73,3,"10-12",60]])
    ]},
    { id: 24, name: "Toji Fushiguro: Restricción Celestial", categoryGroup: "Anime Aesthetic & Superhero", focusCategory: "Fuerza", targetDaysPerWeek: 4, estimatedDurationMinutes: 60, isSystemTemplate: true, imageUri: "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=800", description: "Físico denso, rocoso y letal sin energía maldita: pura potencia en dorsales, pecho y brazos.", days: [
        mkDay(1, "Día 1: Fuerza Implacable", pPull, [[11,4,"5",150],[1,4,"6",120],[56,4,"8",90]]),
        mkDay(2, "Día 2: Cacería de Hechiceros", pLegs, [[21,4,"6",120],[41,4,"6",90],[6,4,"10",75]])
    ]},
    { id: 25, name: "Saitama Daily Protocol", categoryGroup: "Anime Aesthetic & Superhero", focusCategory: "Resistencia", targetDaysPerWeek: 5, estimatedDurationMinutes: 45, isSystemTemplate: true, imageUri: "https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=800", description: "El régimen de One Punch Man adaptado con técnica perfecta para acondicionamiento y definición.", days: [
        mkDay(1, "Día 1: Las 100 Repeticiones", pPush, [[10,5,"20",45],[74,5,"20",45],[29,4,"15",45]])
    ]},
    { id: 26, name: "Zoro: Triple Sword Mastery", categoryGroup: "Anime Aesthetic & Superhero", focusCategory: "Fuerza", targetDaysPerWeek: 4, estimatedDurationMinutes: 60, isSystemTemplate: true, imageUri: "https://images.unsplash.com/photo-1569705460033-cfaa4bf9f822?w=800", description: "Fuerza de corte con hombros gigantes, antebrazos de acero y rotación de core indestructible.", days: [
        mkDay(1, "Día 1: Santoryu Corte Pesado", pPush, [[41,4,"6-8",120],[43,5,"12-15",45],[53,4,"10-12",60]]),
        mkDay(2, "Día 2: Oni Giri (Tracción & Core)", pPull, [[13,4,"6-8",90],[75,4,"20",45],[72,4,"12-15",60]])
    ]},
    { id: 27, name: "PHAT: Fuerza e Hipertrofia (5 Días)", categoryGroup: "Híbridos y Acondicionamiento", focusCategory: "Hipertrofia", targetDaysPerWeek: 5, estimatedDurationMinutes: 70, isSystemTemplate: true, imageUri: "https://images.unsplash.com/photo-1526506118085-60ce8714f8c5?w=800", description: "2 días de fuerza máxima y 3 días de hipertrofia de alto volumen.", days: [
        mkDay(1, "Día 1: Torso Fuerza Máxima", pPush, [[1,4,"3-5",150],[13,4,"3-5",150],[41,3,"6-8",90]]),
        mkDay(2, "Día 2: Pierna Fuerza Máxima", pLegs, [[21,4,"3-5",180],[31,4,"5-8",120],[23,3,"8-10",90]])
    ]},
    { id: 28, name: "PHUL: Power Hypertrophy Upper Lower", categoryGroup: "Híbridos y Acondicionamiento", focusCategory: "Fuerza", targetDaysPerWeek: 4, estimatedDurationMinutes: 60, isSystemTemplate: true, imageUri: "https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=800", description: "Upper Power, Lower Power, Upper Hypertrophy y Lower Hypertrophy.", days: [
        mkDay(1, "Día 1: Upper Power", pPush, [[1,4,"3-5",150],[13,4,"5",120],[41,3,"5",90]]),
        mkDay(2, "Día 2: Lower Power", pLegs, [[21,4,"3-5",150],[11,3,"3-5",150],[81,4,"10-12",60]])
    ]},
    { id: 29, name: "MetCon & Quema Grasa Extremo", categoryGroup: "Híbridos y Acondicionamiento", focusCategory: "Resistencia", targetDaysPerWeek: 4, estimatedDurationMinutes: 45, isSystemTemplate: true, imageUri: "https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?w=800", description: "Acondicionamiento metabólico con descansos cortos para acelerar el gasto calórico.", days: [
        mkDay(1, "Día 1: MetCon Upper Rush", pPush, [[10,4,"15-20",45],[14,4,"12-15",45],[43,4,"15",30]]),
        mkDay(2, "Día 2: MetCon Lower Burn", pLegs, [[28,4,"15",45],[24,4,"16",45],[75,4,"20",30]])
    ]},
    { id: 30, name: "CrossFit WOD Performance", categoryGroup: "Híbridos y Acondicionamiento", focusCategory: "Resistencia", targetDaysPerWeek: 5, estimatedDurationMinutes: 55, isSystemTemplate: true, imageUri: "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=800", description: "Fuerza funcional híbrida combinando levantamientos olímpicos, dominadas y fondos.", days: [
        mkDay(1, "Día 1: WOD Murph Prep", pPull, [[56,4,"10-12",60],[10,4,"15-20",45],[29,4,"12",45]]),
        mkDay(2, "Día 2: Barbell Thrusters & Core", pPush, [[50,4,"6-8",75],[22,4,"6-8",90],[72,4,"12-15",45]])
    ]}
];

const wState = {
    subScreen: 'PRINCIPAL',
    libraryTab: 'MIS_RUTINAS',
    viewMode: 'grid',
    categoryFilter: 'Todas',
    muscleFilter: 'Todos',
    searchQuery: '',
    selectedRoutineId: Number(localStorage.getItem('weavax_primary_routine_id') || 0),
    viewingRoutine: null,
    viewingDayPlan: null,
    activeSession: null,
    timerInterval: null,
    restSecondsLeft: 0,
    restInterval: null,
    finishDraft: null,
    summaryData: null,
    summarySlideIdx: 0
};

// Obtener únicamente las rutinas guardadas en la biblioteca personal del usuario
export function getUserSavedRoutines() {
    return (window.state.workout_routines || [])
        .filter(r => !r.isSystemTemplate)
        .map(r => ({
            ...r,
            days: Array.isArray(r.days) && r.days.length > 0
                ? r.days
                : [mkDay(1, "Día 1", pPush, [[1,4,"8-10",90],[14,4,"8-10",90],[21,4,"8-10",120]])]
        }));
}

function getAllRoutinesAndTemplates() {
    const userRoutines = getUserSavedRoutines();
    return [...userRoutines, ...WEAVAX_30_TEMPLATES];
}

export function getWeeklyWorkoutStats() {
    const now = new Date();
    const day = now.getDay() || 7;
    const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - day + 1).getTime();
    const sessions = (window.state.workout_sessions || []).filter(s => s.isCompleted && Number(s.startedAt || 0) >= monday);
    const weeklyVol = sessions.reduce((acc, s) => acc + Number(s.totalVolumeKg || 0), 0);
    return { count: sessions.length, volume: weeklyVol, sessions };
}

// Exportado para mostrar en Inicio / Mi Día qué entrenamiento toca hoy
export function getTodayScheduledWorkoutInfo() {
    const userRoutines = getUserSavedRoutines();
    if (userRoutines.length === 0) return null;
    const primary = userRoutines.find(r => Number(r.id) === Number(wState.selectedRoutineId)) || userRoutines[0];
    const weekStats = getWeeklyWorkoutStats();
    const days = primary.days || [];
    if (days.length === 0) return null;

    // Buscar el primer día no completado esta semana, o rotar según sesiones hechas
    const nextDay = days.find(d => !weekStats.sessions.some(s => Number(s.routineId) === Number(primary.id) && Number(s.dayNumber) === Number(d.dayNumber)))
        || days[weekStats.count % days.length];

    const startOfToday = new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate()).getTime();
    const doneToday = weekStats.sessions.some(s => Number(s.startedAt || 0) >= startOfToday);

    return {
        routineId: primary.id,
        routineName: primary.name,
        dayNumber: nextDay.dayNumber,
        dayName: nextDay.dayName,
        exercisesCount: (nextDay.exercises || []).length,
        estimatedMin: primary.estimatedDurationMinutes || 60,
        doneToday
    };
}

export function renderWorkouts() {
    const container = document.getElementById('view-workouts');
    if (!container) return;

    const userLibraryRoutines = getUserSavedRoutines();
    const primaryRoutine = userLibraryRoutines.find(r => Number(r.id) === Number(wState.selectedRoutineId)) || userLibraryRoutines[0] || null;
    const weekStats = getWeeklyWorkoutStats();
    const targetDays = Number(primaryRoutine?.targetDaysPerWeek || 4);

    // Banner flotante si hay una sesión activa minimizada y el usuario está navegando otras pantallas de Entrenamiento
    const minimizedBannerHtml = (wState.activeSession && wState.subScreen !== 'SESION_ACTIVA' && wState.subScreen !== 'POR_FINALIZAR') ? `
        <div class="p-4 rounded-2xl bg-accent/20 border-2 border-accent flex flex-wrap items-center justify-between gap-3 mb-6 shadow-lg">
            <div class="flex items-center space-x-3">
                <span class="w-3 h-3 rounded-full bg-emerald-400 animate-ping"></span>
                <div>
                    <p class="text-xs font-extrabold text-white">Entrenamiento en curso: ${wState.activeSession.routineName}</p>
                    <p class="text-[11px] text-gray-300">Tiempo transcurrido: ${Math.floor(wState.activeSession.elapsedSeconds / 60)}m ${wState.activeSession.elapsedSeconds % 60}s</p>
                </div>
            </div>
            <div class="flex gap-2">
                <button onclick="openWorkoutSub('SESION_ACTIVA')" class="px-4 py-2 rounded-xl bg-accent text-white text-xs font-extrabold">Reanudar Sesión</button>
                <button onclick="discardActiveWorkout()" class="px-3.5 py-2 rounded-xl bg-red-500/20 text-red-300 border border-red-500/40 text-xs font-bold">Descartar</button>
            </div>
        </div>
    ` : '';

    if (wState.subScreen === 'PRINCIPAL') {
        container.innerHTML = `
            <div class="space-y-8">
                ${minimizedBannerHtml}

                <!-- CABECERA LIMPIA Y ESPACIADA -->
                <div class="flex flex-wrap items-center justify-between gap-4 pb-2">
                    <div>
                        <h3 class="text-2xl font-black tracking-tight">Entrenamiento</h3>
                        <p class="text-xs text-gray-400 mt-1">Tu programación activa, progreso semanal y biblioteca</p>
                    </div>
                    <div class="flex flex-wrap gap-2.5">
                        <button onclick="openWorkoutSub('LIBRERIA_RUTINAS', 'MIS_RUTINAS')" class="px-4 py-2.5 rounded-xl bg-white dark:bg-[#181824] border border-gray-200 dark:border-[#28283C] hover:border-accent text-xs font-bold transition-all">📚 Biblioteca de Rutinas</button>
                        <button onclick="openWorkoutSub('BANCO_EJERCICIOS')" class="px-4 py-2.5 rounded-xl bg-white dark:bg-[#181824] border border-gray-200 dark:border-[#28283C] hover:border-accent text-xs font-bold transition-all">💪 Ejercicios</button>
                        <button onclick="openWorkoutSub('HISTORIAL')" class="px-4 py-2.5 rounded-xl bg-white dark:bg-[#181824] border border-gray-200 dark:border-[#28283C] hover:border-accent text-xs font-bold transition-all">🕒 Historial</button>
                    </div>
                </div>

                <!-- 3 TARJETAS DE PROGRESO SEMANAL -->
                <div class="grid grid-cols-1 sm:grid-cols-3 gap-5">
                    <div class="p-6 rounded-2xl bg-white dark:bg-[#181824] border border-gray-200 dark:border-[#28283C]">
                        <span class="text-[10px] font-bold uppercase tracking-wider text-gray-400">Meta de la Semana</span>
                        <div class="flex items-baseline justify-between mt-2">
                            <span class="text-2xl font-black text-accent">${weekStats.count} / ${targetDays}</span>
                            <span class="text-xs text-gray-400">entrenamientos</span>
                        </div>
                        <div class="w-full h-2 bg-gray-200 dark:bg-[#0A0A0F] rounded-full mt-3.5 overflow-hidden">
                            <div class="h-full bg-accent transition-all" style="width:${Math.min(100, Math.round((weekStats.count / targetDays) * 100))}%"></div>
                        </div>
                    </div>
                    <div class="p-6 rounded-2xl bg-white dark:bg-[#181824] border border-gray-200 dark:border-[#28283C]">
                        <span class="text-[10px] font-bold uppercase tracking-wider text-gray-400">Volumen Semanal</span>
                        <div class="text-2xl font-black mt-2">${weekStats.volume.toLocaleString('es-BO')} <span class="text-sm font-normal text-gray-400">kg</span></div>
                        <p class="text-[11px] text-emerald-400 mt-2">Registrado en series completadas</p>
                    </div>
                    <div class="p-6 rounded-2xl bg-white dark:bg-[#181824] border border-gray-200 dark:border-[#28283C]">
                        <span class="text-[10px] font-bold uppercase tracking-wider text-gray-400">Sesiones Totales</span>
                        <div class="text-2xl font-black mt-2">${(window.state.workout_sessions || []).length} <span class="text-sm font-normal text-gray-400">completadas</span></div>
                        <p class="text-[11px] text-purple-400 mt-2">Sincronizadas en tu cuenta</p>
                    </div>
                </div>

                <!-- SELECTOR DE RUTINA PRINCIPAL (EXCLUSIVO DE MIS RUTINAS GUARDADAS) -->
                ${!primaryRoutine ? `
                    <div class="p-8 rounded-3xl bg-white dark:bg-[#181824] border border-gray-200 dark:border-[#28283C] text-center space-y-4">
                        <span class="text-3xl">🏋️</span>
                        <h4 class="text-lg font-black">Aún no tienes una Rutina Principal en tu Biblioteca</h4>
                        <p class="text-xs text-gray-400 max-w-md mx-auto leading-relaxed">Para seleccionar tu rutina principal, primero crea una rutina propia o entra a la Biblioteca de Plantillas WeaVax y copia tu favorita a "Mis Rutinas".</p>
                        <div class="flex flex-wrap justify-center gap-3 pt-2">
                            <button onclick="openWorkoutSub('LIBRERIA_RUTINAS', 'PLANTILLAS')" class="px-5 py-2.5 rounded-xl bg-accent text-white text-xs font-extrabold shadow-lg">Explorar Plantillas WeaVax</button>
                            <button onclick="openRoutineCreatorModal()" class="px-5 py-2.5 rounded-xl bg-[#0A0A0F] border border-[#28283C] text-xs font-bold">+ Crear Mi Propia Rutina</button>
                        </div>
                    </div>
                ` : `
                    <div class="p-6 sm:p-7 rounded-3xl bg-white dark:bg-[#181824] border border-gray-200 dark:border-[#28283C] space-y-6">
                        <div class="flex flex-wrap items-center justify-between gap-4 border-b border-gray-200 dark:border-[#28283C] pb-5">
                            <div>
                                <span class="text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-full bg-accent/15 text-accent">Rutina Principal Activa</span>
                                <h4 class="text-xl font-black mt-2.5">${primaryRoutine.name}</h4>
                                <p class="text-xs text-gray-400 mt-1">${primaryRoutine.description || ''}</p>
                            </div>
                            <div class="flex flex-wrap items-center gap-2.5">
                                <select onchange="selectPrimaryRoutine(this.value)" class="px-3.5 py-2.5 rounded-xl bg-gray-100 dark:bg-[#0A0A0F] border border-gray-200 dark:border-[#28283C] text-xs font-bold">
                                    ${userLibraryRoutines.map(r => `<option value="${r.id}" ${Number(r.id) === Number(primaryRoutine.id) ? 'selected' : ''}>${r.name} (${r.targetDaysPerWeek || 4} días)</option>`).join('')}
                                </select>
                                <button onclick="openRoutineDetailView(${primaryRoutine.id})" class="px-4 py-2.5 rounded-xl bg-accent/15 text-accent text-xs font-bold">Detalles</button>
                            </div>
                        </div>

                        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            ${(primaryRoutine.days || []).map(d => {
                                const completedThisWeek = weekStats.sessions.some(s => Number(s.routineId) === Number(primaryRoutine.id) && Number(s.dayNumber) === Number(d.dayNumber));
                                return `
                                    <div class="p-4 rounded-2xl bg-gray-50 dark:bg-[#0A0A0F] border ${completedThisWeek ? 'border-emerald-500/50' : 'border-gray-200 dark:border-[#28283C]'} flex items-center justify-between gap-3">
                                        <div onclick="openDayDetailView(${primaryRoutine.id}, ${d.dayNumber})" class="flex items-center space-x-3.5 cursor-pointer flex-1 min-w-0">
                                            <div class="w-12 h-12 rounded-xl bg-accent/20 border border-accent/40 flex items-center justify-center font-black text-accent shrink-0 overflow-hidden">
                                                ${d.dayImageUri ? `<img src="${d.dayImageUri}" class="w-full h-full object-cover">` : d.dayName.charAt(0)}
                                            </div>
                                            <div class="min-w-0 flex-1">
                                                <div class="flex items-center space-x-1.5">
                                                    <p class="text-xs font-extrabold truncate">${d.dayName}</p>
                                                    ${completedThisWeek ? '<span class="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold">✓</span>' : ''}
                                                </div>
                                                <p class="text-[11px] text-gray-400 mt-1">${(d.exercises || []).length} ejercicios · ~${primaryRoutine.estimatedDurationMinutes || 60} min</p>
                                            </div>
                                        </div>
                                        <button onclick="beginActiveWorkoutSession(${primaryRoutine.id}, ${d.dayNumber})" class="w-10 h-10 rounded-full bg-accent text-white flex items-center justify-center font-bold shadow-lg hover:opacity-90 shrink-0" title="Entrenar este día">
                                            ▶
                                        </button>
                                    </div>
                                `;
                            }).join('')}
                        </div>
                    </div>
                `}

                <!-- TARJETA ENTRENADOR PERSONAL IA -->
                <div class="p-6 rounded-3xl bg-gradient-to-r from-[#181824] via-[#1E1B36] to-[#181824] border border-accent/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div class="flex items-start space-x-4">
                        <div class="w-12 h-12 rounded-2xl bg-accent/20 border border-accent flex items-center justify-center text-2xl shrink-0">🤖</div>
                        <div>
                            <div class="flex items-center space-x-2">
                                <h4 class="text-base font-black text-white">Entrenador Personal IA · Vax Coach</h4>
                                <span class="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300">Activo</span>
                            </div>
                            <p class="text-xs text-gray-300 mt-1">Analiza tu fatiga muscular y te sugiere qué día entrenar hoy con sobrecarga progresiva.</p>
                        </div>
                    </div>
                    <button onclick="openWorkoutSub('COACH_IA')" class="px-5 py-2.5 rounded-xl bg-accent text-white text-xs font-extrabold shrink-0 shadow-lg">
                        Abrir Coach IA →
                    </button>
                </div>

                <!-- MIS RUTINAS EN TU BIBLIOTECA -->
                <div class="space-y-4">
                    <div class="flex items-center justify-between">
                        <div>
                            <h4 class="text-base font-extrabold">Mis Rutinas (${userLibraryRoutines.length})</h4>
                            <p class="text-xs text-gray-400 mt-0.5">Tus programas guardados listos para usar</p>
                        </div>
                        <button onclick="openWorkoutSub('LIBRERIA_RUTINAS', 'PLANTILLAS')" class="text-xs font-bold text-accent hover:underline">
                            Ir a Biblioteca de Plantillas WeaVax →
                        </button>
                    </div>

                    ${userLibraryRoutines.length === 0 ? `
                        <p class="text-xs text-gray-400">Todavía no tienes rutinas en tu biblioteca personal.</p>
                    ` : `
                        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                            ${userLibraryRoutines.map(r => renderRoutineCard(r, 'grid', false)).join('')}
                        </div>
                    `}
                </div>
            </div>
        `;
        return;
    }

    // 2. BIBLIOTECA DE RUTINAS (MIS RUTINAS vs PLANTILLAS WEAVAX CON BOTÓN COPIAR A BIBLIOTECA)
    if (wState.subScreen === 'LIBRERIA_RUTINAS') {
        const categories = ['Todas', 'PPL (Push Pull Legs)', 'Torso / Pierna', 'Full Body', 'Énfasis Específico', 'Calistenia y Funcional', 'Anime Aesthetic & Superhero', 'Híbridos y Acondicionamiento'];
        const isTemplatesTab = wState.libraryTab === 'PLANTILLAS';
        const listToShow = isTemplatesTab
            ? WEAVAX_30_TEMPLATES.filter(t => wState.categoryFilter === 'Todas' || t.categoryGroup === wState.categoryFilter)
            : userLibraryRoutines;

        container.innerHTML = `
            <div class="space-y-6">
                ${minimizedBannerHtml}
                <div class="flex flex-wrap items-center justify-between gap-4">
                    <div class="flex items-center space-x-3">
                        <button onclick="openWorkoutSub('PRINCIPAL')" class="px-3.5 py-2 rounded-xl bg-[#181824] border border-[#28283C] text-xs font-bold">← Volver</button>
                        <div>
                            <h3 class="text-xl font-black">Biblioteca de Rutinas</h3>
                            <p class="text-xs text-gray-400">Gestiona tus rutinas o copia plantillas WeaVax a tu biblioteca</p>
                        </div>
                    </div>
                    <div class="flex items-center gap-2">
                        <button onclick="setLibraryViewMode('grid')" class="px-3 py-2 rounded-xl border ${wState.viewMode === 'grid' ? 'bg-accent text-white border-accent' : 'border-[#28283C]'} text-xs font-bold">⊞ Cuadrícula</button>
                        <button onclick="setLibraryViewMode('list')" class="px-3 py-2 rounded-xl border ${wState.viewMode === 'list' ? 'bg-accent text-white border-accent' : 'border-[#28283C]'} text-xs font-bold">☰ Lista</button>
                    </div>
                </div>

                <div class="flex gap-2.5 border-b border-gray-200 dark:border-[#28283C] pb-4">
                    <button onclick="openWorkoutSub('LIBRERIA_RUTINAS', 'MIS_RUTINAS')" class="px-4 py-2.5 rounded-xl text-xs font-bold ${!isTemplatesTab ? 'bg-accent text-white' : 'bg-[#181824] text-gray-400'}">Mis Rutinas (${userLibraryRoutines.length})</button>
                    <button onclick="openWorkoutSub('LIBRERIA_RUTINAS', 'PLANTILLAS')" class="px-4 py-2.5 rounded-xl text-xs font-bold ${isTemplatesTab ? 'bg-accent text-white' : 'bg-[#181824] text-gray-400'}">Plantillas WeaVax (30)</button>
                </div>

                ${isTemplatesTab ? `
                    <div class="flex flex-wrap gap-2">
                        ${categories.map(c => `
                            <button onclick="setTemplateCategory('${c}')" class="px-3.5 py-1.5 rounded-full text-[11px] font-bold ${wState.categoryFilter === c ? 'bg-accent text-white' : 'bg-[#181824] border border-[#28283C] text-gray-400'}">${c}</button>
                        `).join('')}
                    </div>
                ` : ''}

                <div class="${wState.viewMode === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5' : 'space-y-3'}">
                    ${!isTemplatesTab ? `
                        <div onclick="openRoutineCreatorModal()" class="p-6 rounded-2xl border-2 border-dashed border-accent/50 hover:border-accent flex flex-col items-center justify-center text-center cursor-pointer min-h-[180px]">
                            <span class="text-2xl text-accent font-black">+</span>
                            <p class="text-sm font-extrabold text-accent mt-1">Crear nueva rutina</p>
                            <p class="text-[11px] text-gray-400 mt-0.5">Personaliza tus propios días y ejercicios</p>
                        </div>
                    ` : ''}
                    ${listToShow.map(r => renderRoutineCard(r, wState.viewMode, isTemplatesTab)).join('')}
                </div>
            </div>
        `;
        return;
    }

    // 3. DETALLE DEL PROGRAMA
    if (wState.subScreen === 'DETALLE_RUTINA' && wState.viewingRoutine) {
        const r = wState.viewingRoutine;
        const isSavedInUserLib = userLibraryRoutines.some(u => Number(u.id) === Number(r.id) || u.name === r.name);

        container.innerHTML = `
            <div class="space-y-6">
                ${minimizedBannerHtml}
                <div class="flex flex-wrap items-center justify-between gap-3">
                    <button onclick="openWorkoutSub('LIBRERIA_RUTINAS')" class="px-3.5 py-2 rounded-xl bg-[#181824] border border-[#28283C] text-xs font-bold">← Volver</button>
                    <div class="flex gap-2">
                        ${isSavedInUserLib ? `
                            <button onclick="selectPrimaryRoutine(${r.id})" class="px-4 py-2 rounded-xl bg-accent text-white text-xs font-extrabold">★ Elegir como Rutina Principal</button>
                        ` : `
                            <button onclick="copyTemplateToLibrary(${r.id})" class="px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-extrabold">📥 Copiar a mi biblioteca</button>
                        `}
                    </div>
                </div>

                <div class="rounded-3xl overflow-hidden bg-white dark:bg-[#181824] border border-gray-200 dark:border-[#28283C]">
                    <div class="h-48 bg-cover bg-center relative" style="background-image:url('${r.imageUri || pPush}')">
                        <div class="absolute inset-0 bg-gradient-to-t from-[#181824] via-[#181824]/40 to-transparent"></div>
                        <div class="absolute bottom-4 left-6 right-6">
                            <span class="text-[10px] font-bold uppercase px-2.5 py-1 rounded-full bg-accent text-white">${r.focusCategory || 'Hipertrofia'} · ${r.targetDaysPerWeek || 4} días/sem</span>
                            <h3 class="text-2xl font-black text-white mt-2">${r.name}</h3>
                            <p class="text-xs text-gray-300 mt-1">${r.description || ''}</p>
                        </div>
                    </div>
                    <div class="p-6 space-y-4">
                        <h4 class="text-sm font-extrabold">Días del Programa (${(r.days || []).length})</h4>
                        <div class="space-y-3">
                            ${(r.days || []).map(d => `
                                <div class="p-4 rounded-2xl bg-gray-50 dark:bg-[#0A0A0F] border border-gray-200 dark:border-[#28283C] flex items-center justify-between">
                                    <div onclick="openDayDetailView(${r.id}, ${d.dayNumber})" class="flex items-center space-x-3.5 cursor-pointer flex-1">
                                        <div class="w-12 h-12 rounded-xl bg-accent/20 text-accent font-black flex items-center justify-center overflow-hidden">
                                            ${d.dayImageUri ? `<img src="${d.dayImageUri}" class="w-full h-full object-cover">` : d.dayName.charAt(0)}
                                        </div>
                                        <div>
                                            <p class="text-sm font-extrabold">${d.dayName}</p>
                                            <p class="text-xs text-gray-400 mt-0.5">${(d.exercises || []).map(e => e.exerciseName).slice(0, 3).join(', ')}...</p>
                                        </div>
                                    </div>
                                    <button onclick="beginActiveWorkoutSession(${r.id}, ${d.dayNumber})" class="w-10 h-10 rounded-full bg-accent text-white font-bold flex items-center justify-center">▶</button>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                </div>
            </div>
        `;
        return;
    }

    // 4. DETALLE DE DÍA DE ENTRENAMIENTO
    if (wState.subScreen === 'DETALLE_ENTRENAMIENTO' && wState.viewingDayPlan) {
        const r = wState.viewingRoutine;
        const d = wState.viewingDayPlan;
        const muscles = Array.from(new Set((d.exercises || []).map(e => e.muscleGroup)));
        const totalSets = (d.exercises || []).reduce((acc, e) => acc + Number(e.targetSets || 3), 0);

        container.innerHTML = `
            <div class="space-y-6">
                <div class="flex items-center justify-between">
                    <button onclick="openRoutineDetailView(${r.id})" class="px-3.5 py-2 rounded-xl bg-[#181824] border border-[#28283C] text-xs font-bold">← Volver al Programa</button>
                    <button onclick="beginActiveWorkoutSession(${r.id}, ${d.dayNumber})" class="px-5 py-2.5 rounded-full bg-accent text-white text-xs font-extrabold shadow-lg">▶ Iniciar Entrenamiento</button>
                </div>

                <div class="p-6 rounded-3xl bg-white dark:bg-[#181824] border border-gray-200 dark:border-[#28283C] space-y-5">
                    <h3 class="text-xl font-black">${d.dayName}</h3>
                    <div class="flex flex-wrap gap-4 text-xs text-gray-400">
                        <span>📊 <strong>${totalSets}</strong> series programadas</span>
                        <span>⏱️ <strong>~${r.estimatedDurationMinutes || 60} min</strong> estimados</span>
                    </div>
                    <div class="flex flex-wrap gap-2">
                        ${muscles.map(m => `<span class="px-3 py-1 rounded-full bg-accent/15 text-accent text-xs font-bold">${m}</span>`).join('')}
                    </div>

                    <div class="space-y-3 pt-2">
                        ${(d.exercises || []).map(ex => {
                            const catEx = getExById(ex.exerciseId);
                            return `
                                <div onclick="showExerciseAnatomyModal(${catEx.id})" class="p-4 rounded-2xl bg-gray-50 dark:bg-[#0A0A0F] border border-gray-200 dark:border-[#28283C] flex items-center justify-between cursor-pointer hover:border-accent">
                                    <div class="flex items-center space-x-4">
                                        <img src="${catEx.img}" class="w-14 h-14 rounded-xl object-contain bg-white p-1">
                                        <div>
                                            <p class="text-sm font-bold">${ex.exerciseName}</p>
                                            <p class="text-xs text-gray-400 mt-0.5">${ex.targetSets} series × ${ex.targetRepsRange} reps · Descanso ${ex.restSeconds}s</p>
                                        </div>
                                    </div>
                                    <span class="text-xs text-accent font-bold">Anatomía →</span>
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>
            </div>
        `;
        return;
    }

    // 5. SESIÓN ACTIVA (CON BOTÓN SALIR/MINIMIZAR, BOTÓN DESCARTAR Y MODAL DE TIPO DE SERIE)
    if (wState.subScreen === 'SESION_ACTIVA' && wState.activeSession) {
        const s = wState.activeSession;
        const mins = String(Math.floor(s.elapsedSeconds / 60)).padStart(2, '0');
        const secs = String(s.elapsedSeconds % 60).padStart(2, '0');
        const liveVol = s.exercises.reduce((acc, ex) => acc + ex.sets.filter(st => st.isCompleted).reduce((v, st) => v + (Number(st.weightKg || 0) * Number(st.reps || 0)), 0), 0);

        const setTypeBadge = (st, idx) => {
            if (st.setType === 'W') return `<span class="text-amber-400 font-black">W</span>`;
            if (st.setType === 'D') return `<span class="text-cyan-400 font-black">D</span>`;
            if (st.setType === 'F') return `<span class="text-red-400 font-black">F</span>`;
            return `<span class="text-white font-bold">${idx + 1}</span>`;
        };

        container.innerHTML = `
            <div class="space-y-6">
                <div class="sticky top-16 z-20 p-4 sm:p-5 rounded-2xl bg-[#181824] border border-accent flex flex-wrap items-center justify-between gap-3 shadow-xl">
                    <div class="flex items-center space-x-3">
                        <button onclick="openWorkoutSub('PRINCIPAL')" class="px-3 py-2 rounded-xl bg-[#0A0A0F] border border-[#28283C] hover:border-accent text-xs font-bold" title="Minimizar y volver a Entrenamiento">
                            ← Minimizar
                        </button>
                        <div>
                            <span class="text-[10px] font-bold uppercase text-accent">${s.routineName}</span>
                            <div class="flex items-center space-x-4 mt-0.5">
                                <span id="live-workout-clock" class="text-xl font-black font-mono">${mins}:${secs}</span>
                                <span class="text-xs text-gray-400">Volumen real: <strong class="text-white">${liveVol.toFixed(0)} kg</strong></span>
                                ${wState.restSecondsLeft > 0 ? `<span class="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-xs font-bold">⏳ ${wState.restSecondsLeft}s</span>` : ''}
                            </div>
                        </div>
                    </div>
                    <div class="flex flex-wrap gap-2">
                        <button onclick="openAddExerciseToActiveModal()" class="px-3.5 py-2 rounded-xl bg-[#0A0A0F] border border-[#28283C] text-xs font-bold">+ Ejercicio</button>
                        <button onclick="discardActiveWorkout()" class="px-3.5 py-2 rounded-xl bg-red-500/15 text-red-400 border border-red-500/30 text-xs font-bold">🗑️ Descartar</button>
                        <button onclick="attemptFinishWorkout()" class="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold">Finalizar</button>
                    </div>
                </div>

                <div class="space-y-5">
                    ${s.exercises.map((ex, exIdx) => `
                        <div class="p-5 sm:p-6 rounded-2xl bg-white dark:bg-[#181824] border border-gray-200 dark:border-[#28283C] space-y-4">
                            <div class="flex items-center justify-between">
                                <div class="flex items-center space-x-3.5">
                                    <img src="${ex.imageUri}" class="w-12 h-12 rounded-xl object-contain bg-white p-1">
                                    <div>
                                        <h4 class="text-sm font-extrabold">${ex.exerciseName}</h4>
                                        <p class="text-[11px] text-gray-400">${ex.muscleGroup} · Descanso ${ex.restSeconds}s</p>
                                    </div>
                                </div>
                                <button onclick="removeExerciseFromActive(${exIdx})" class="text-xs text-gray-500 hover:text-red-400">Quitar</button>
                            </div>

                            <div class="grid grid-cols-12 gap-2 text-[10px] font-bold uppercase text-gray-400 px-2">
                                <div class="col-span-3">Tipo / Serie</div>
                                <div class="col-span-3">Peso (kg)</div>
                                <div class="col-span-3">Reps</div>
                                <div class="col-span-3 text-center">Completar</div>
                            </div>

                            <div class="space-y-2">
                                ${ex.sets.map((st, stIdx) => `
                                    <div class="grid grid-cols-12 gap-2 items-center p-2.5 rounded-xl ${st.isCompleted ? 'bg-emerald-500/10 border border-emerald-500/30' : 'bg-gray-50 dark:bg-[#0A0A0F]'} text-xs">
                                        <div class="col-span-3">
                                            <button onclick="openSetTypePickerModal(${exIdx}, ${stIdx})" class="w-full px-2.5 py-1.5 rounded-lg bg-[#181824] border border-[#28283C] hover:border-accent flex items-center justify-between text-xs">
                                                ${setTypeBadge(st, stIdx)}
                                                <span class="text-[9px] text-gray-400">▼</span>
                                            </button>
                                        </div>
                                        <div class="col-span-3">
                                            <input type="number" step="0.5" placeholder="0" value="${st.weightKg > 0 ? st.weightKg : ''}" oninput="updateActiveSetVal(${exIdx}, ${stIdx}, 'weightKg', this.value)" class="w-full px-2 py-1.5 rounded-lg bg-[#181824] border border-[#28283C] text-center font-bold">
                                        </div>
                                        <div class="col-span-3">
                                            <input type="number" placeholder="0" value="${st.reps > 0 ? st.reps : ''}" oninput="updateActiveSetVal(${exIdx}, ${stIdx}, 'reps', this.value)" class="w-full px-2 py-1.5 rounded-lg bg-[#181824] border border-[#28283C] text-center font-bold">
                                        </div>
                                        <div class="col-span-3 flex justify-center">
                                            <input type="checkbox" ${st.isCompleted ? 'checked' : ''} onchange="toggleActiveSetDone(${exIdx}, ${stIdx})" class="w-5 h-5 accent-emerald-500 rounded cursor-pointer">
                                        </div>
                                    </div>
                                `).join('')}
                            </div>

                            <div class="flex gap-3 pt-1">
                                <button onclick="addSetToActive(${exIdx})" class="text-xs font-bold text-accent">+ Añadir Serie</button>
                                <button onclick="removeLastSetFromActive(${exIdx})" class="text-xs text-gray-400 hover:text-red-400">- Quitar Serie</button>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
        return;
    }

    // 6. DETALLES DEL ENTRENAMIENTO FINALIZADO (CON SUBIDA DE FOTO DEL ENTRENAMIENTO)
    if (wState.subScreen === 'POR_FINALIZAR' && wState.finishDraft) {
        const d = wState.finishDraft;
        container.innerHTML = `
            <div class="max-w-xl mx-auto p-6 sm:p-8 rounded-3xl bg-white dark:bg-[#181824] border border-gray-200 dark:border-[#28283C] space-y-5">
                <div class="flex items-center justify-between">
                    <span class="text-[10px] font-bold uppercase px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400">Cronómetro Detenido · Revisión Final</span>
                    <button onclick="openWorkoutSub('SESION_ACTIVA')" class="text-xs text-accent font-bold">← Volver a las series</button>
                </div>

                <div>
                    <label class="text-[11px] font-bold text-gray-400 uppercase">Título del entrenamiento</label>
                    <input id="fin-title" value="${d.title}" class="mt-1 w-full px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-[#0A0A0F] border border-gray-200 dark:border-[#28283C] font-bold">
                </div>

                <!-- SUBIR FOTO DEL ENTRENAMIENTO -->
                <div>
                    <label class="text-[11px] font-bold text-gray-400 uppercase block mb-1.5">Foto del Entrenamiento (Opcional)</label>
                    <div class="p-4 rounded-2xl bg-gray-50 dark:bg-[#0A0A0F] border border-dashed border-[#28283C] text-center space-y-2">
                        ${d.photoDataUrl ? `<img src="${d.photoDataUrl}" class="max-h-48 mx-auto rounded-xl object-cover mb-2">` : ''}
                        <label class="inline-block px-4 py-2 rounded-xl bg-accent/15 text-accent text-xs font-bold cursor-pointer">
                            📷 Seleccionar o Subir Foto
                            <input type="file" accept="image/*" class="hidden" onchange="handleWorkoutPhotoUpload(event)">
                        </label>
                    </div>
                </div>

                <div>
                    <label class="text-[11px] font-bold text-gray-400 uppercase">Duración Real (Horas : Minutos : Segundos)</label>
                    <div class="grid grid-cols-3 gap-3 mt-1.5">
                        <div class="p-2.5 rounded-xl bg-gray-50 dark:bg-[#0A0A0F] border border-[#28283C] text-center">
                            <span class="text-[10px] text-gray-400 block">Horas</span>
                            <input id="fin-h" type="number" min="0" max="12" value="${d.hours}" class="w-full bg-transparent text-center text-lg font-black focus:outline-none">
                        </div>
                        <div class="p-2.5 rounded-xl bg-gray-50 dark:bg-[#0A0A0F] border border-[#28283C] text-center">
                            <span class="text-[10px] text-gray-400 block">Minutos</span>
                            <input id="fin-m" type="number" min="0" max="59" value="${d.minutes}" class="w-full bg-transparent text-lg font-black text-center focus:outline-none">
                        </div>
                        <div class="p-2.5 rounded-xl bg-gray-50 dark:bg-[#0A0A0F] border border-[#28283C] text-center">
                            <span class="text-[10px] text-gray-400 block">Segundos</span>
                            <input id="fin-s" type="number" min="0" max="59" value="${d.seconds}" class="w-full bg-transparent text-lg font-black text-center focus:outline-none">
                        </div>
                    </div>
                </div>

                <div>
                    <label class="text-[11px] font-bold text-gray-400 uppercase">Notas de la sesión</label>
                    <textarea id="fin-notes" rows="3" placeholder="¿Cómo te sentiste hoy?" class="mt-1 w-full px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-[#0A0A0F] border border-[#28283C] text-xs">${d.notes || ''}</textarea>
                </div>

                <div class="flex gap-3 pt-2">
                    <button onclick="discardActiveWorkout()" class="flex-1 py-3 rounded-xl bg-red-500/15 text-red-400 font-bold text-xs">🗑️ Descartar</button>
                    <button onclick="checkRoutineReconciliationBeforeSave()" class="flex-1 py-3 rounded-xl bg-accent text-white font-extrabold text-xs shadow-lg">Guardar Entrenamiento</button>
                </div>
            </div>
        `;
        return;
    }

    // 7. CARRUSEL DE 5 TARJETAS POST-ENTRENAMIENTO (100% DATOS REALES DE SERIES MARCADAS ✓)
    if (wState.subScreen === 'RESUMEN_SESION' && wState.summaryData) {
        const sum = wState.summaryData;
        const idx = wState.summarySlideIdx;
        const slides = [
            // Tarjeta 1: Racha y Foto
            `<div class="p-8 rounded-3xl bg-gradient-to-br from-[#181824] to-purple-900/40 border border-accent text-center space-y-3">
                ${sum.photoDataUrl ? `<img src="${sum.photoDataUrl}" class="w-32 h-32 mx-auto rounded-2xl object-cover border-2 border-accent">` : `<div class="text-5xl">🔥</div>`}
                <h3 class="text-2xl font-black">¡Racha Semanal Activa!</h3>
                <p class="text-sm text-gray-300">${sum.title}</p>
                <div class="text-xs font-extrabold tracking-widest uppercase text-accent pt-3">WEAVAX LIFEOS · +60 XP</div>
            </div>`,
            // Tarjeta 2: 1RM Real (solo de series completadas con peso > 0)
            `<div class="p-8 rounded-3xl bg-[#181824] border border-amber-500/40 text-center space-y-3">
                <div class="text-4xl">🏆</div>
                <h3 class="text-xl font-black text-amber-300">Récords y 1RM de Hoy</h3>
                ${sum.prs.length === 0
                    ? `<p class="text-xs text-gray-400 py-4">No registraste series completadas con peso en esta sesión.</p>`
                    : `<div class="space-y-1.5 text-xs pt-2">${sum.prs.map(p => `<div class="p-2.5 rounded-lg bg-[#0A0A0F] font-bold">${p}</div>`).join('')}</div>`
                }
            </div>`,
            // Tarjeta 3: Métricas Reales
            `<div class="p-8 rounded-3xl bg-[#181824] border border-[#28283C] space-y-4">
                <h3 class="text-lg font-black text-center">Métricas Reales Trabajadas</h3>
                <div class="grid grid-cols-3 gap-2 text-center">
                    <div class="p-3 rounded-xl bg-[#0A0A0F]"><div class="text-lg font-black text-accent">${sum.volume} kg</div><div class="text-[10px] text-gray-400">Volumen Real</div></div>
                    <div class="p-3 rounded-xl bg-[#0A0A0F]"><div class="text-lg font-black text-emerald-400">${sum.sets}</div><div class="text-[10px] text-gray-400">Series Hechas</div></div>
                    <div class="p-3 rounded-xl bg-[#0A0A0F]"><div class="text-lg font-black text-blue-400">${sum.durationMin}m</div><div class="text-[10px] text-gray-400">Duración</div></div>
                </div>
                <div class="flex flex-wrap justify-center gap-2">
                    ${sum.muscles.length === 0 ? '<span class="text-xs text-gray-400">Sin músculos registrados</span>' : sum.muscles.map(m => `<span class="px-3 py-1 rounded-full bg-accent/20 text-accent text-xs font-bold">${m}</span>`).join('')}
                </div>
            </div>`,
            // Tarjeta 4: Equivalencia Real
            `<div class="p-8 rounded-3xl bg-[#181824] border border-[#28283C] text-center space-y-3">
                <div class="text-5xl">🏋️</div>
                <h3 class="text-xl font-black">Volumen Efectivo: ${sum.volume} kg</h3>
                <p class="text-sm text-gray-300">
                    ${Number(sum.volume) === 0
                        ? 'Sesión completada sin carga externa registrada.'
                        : Number(sum.volume) > 5000
                            ? '¡Equivalente al peso de un barco vikingo!'
                            : '¡Gran trabajo de sobrecarga acumulada hoy!'}
                </p>
            </div>`,
            // Tarjeta 5: Desglose de series efectivamente marcadas
            `<div class="p-8 rounded-3xl bg-[#181824] border border-[#28283C] space-y-3">
                <h3 class="text-base font-black">Series Completadas por Ejercicio</h3>
                ${sum.breakdown.length === 0
                    ? `<p class="text-xs text-gray-400">Ninguna serie fue marcada como completada (✓).</p>`
                    : `<div class="space-y-1.5 text-xs">${sum.breakdown.map(b => `<div class="flex justify-between p-2 rounded bg-[#0A0A0F]"><span>${b.name}</span><span class="font-bold text-accent">${b.sets} series (${b.vol} kg)</span></div>`).join('')}</div>`
                }
            </div>`
        ];

        container.innerHTML = `
            <div class="max-w-md mx-auto space-y-4">
                ${slides[idx]}
                <div class="flex justify-between items-center">
                    <button onclick="stepSummarySlide(-1)" class="px-4 py-2 rounded-xl bg-[#181824] text-xs font-bold">← Anterior</button>
                    <span class="text-xs font-bold text-gray-400">Tarjeta ${idx + 1} de 5</span>
                    <button onclick="stepSummarySlide(1)" class="px-4 py-2 rounded-xl bg-[#181824] text-xs font-bold">Siguiente →</button>
                </div>
                <button onclick="openWorkoutSub('PRINCIPAL')" class="w-full py-3 rounded-xl bg-accent text-white font-extrabold text-xs">Cerrar Resumen</button>
            </div>
        `;
        return;
    }

    // 8. BANCO DE EJERCICIOS
    if (wState.subScreen === 'BANCO_EJERCICIOS') {
        const muscles = ['Todos', 'Pecho', 'Espalda', 'Cuádriceps', 'Isquiosurales/Glúteos', 'Hombros', 'Bíceps', 'Tríceps', 'Core', 'Pantorrillas'];
        const filtered = EXERCISE_CATALOG.filter(e =>
            (wState.muscleFilter === 'Todos' || e.muscleGroup === wState.muscleFilter) &&
            e.name.toLowerCase().includes(wState.searchQuery.toLowerCase())
        );

        container.innerHTML = `
            <div class="space-y-6">
                ${minimizedBannerHtml}
                <div class="flex items-center justify-between gap-3">
                    <button onclick="openWorkoutSub('PRINCIPAL')" class="px-3.5 py-2 rounded-xl bg-[#181824] border border-[#28283C] text-xs font-bold">← Volver</button>
                    <input oninput="filterExerciseBank(this.value)" value="${wState.searchQuery}" placeholder="Buscar ejercicio..." class="flex-1 max-w-md px-4 py-2 rounded-xl bg-[#181824] border border-[#28283C] text-xs">
                </div>
                <div class="flex flex-wrap gap-2">
                    ${muscles.map(m => `<button onclick="setMuscleBankFilter('${m}')" class="px-3.5 py-1.5 rounded-full text-[11px] font-bold ${wState.muscleFilter === m ? 'bg-accent text-white' : 'bg-[#181824] text-gray-400'}">${m}</button>`).join('')}
                </div>
                <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    ${filtered.map(ex => `
                        <div onclick="showExerciseAnatomyModal(${ex.id})" class="p-4 rounded-2xl bg-white dark:bg-[#181824] border border-gray-200 dark:border-[#28283C] flex items-center space-x-3.5 cursor-pointer hover:border-accent">
                            <img src="${ex.img}" class="w-14 h-14 rounded-xl object-contain bg-white p-1 shrink-0">
                            <div>
                                <p class="text-xs font-extrabold">${ex.name}</p>
                                <p class="text-[10px] text-gray-400 mt-1">${ex.muscleGroup} · ${ex.equipment}</p>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
        return;
    }

    // 9. HISTORIAL
    if (wState.subScreen === 'HISTORIAL') {
        const list = window.state.workout_sessions || [];
        container.innerHTML = `
            <div class="space-y-6">
                ${minimizedBannerHtml}
                <div class="flex items-center justify-between">
                    <button onclick="openWorkoutSub('PRINCIPAL')" class="px-3.5 py-2 rounded-xl bg-[#181824] border border-[#28283C] text-xs font-bold">← Volver</button>
                    <h3 class="text-lg font-black">Historial (${list.length} sesiones)</h3>
                </div>
                <div class="space-y-3">
                    ${list.length === 0 ? '<p class="text-xs text-gray-400">Sin entrenamientos registrados.</p>' : list.map(s => `
                        <div class="p-4 rounded-2xl bg-white dark:bg-[#181824] border border-gray-200 dark:border-[#28283C] flex justify-between items-center">
                            <div class="flex items-center space-x-3.5">
                                ${s.photoDataUrl ? `<img src="${s.photoDataUrl}" class="w-12 h-12 rounded-xl object-cover">` : ''}
                                <div>
                                    <p class="text-sm font-extrabold">${s.routineName}</p>
                                    <p class="text-xs text-gray-400 mt-0.5">${new Date(Number(s.startedAt || Date.now())).toLocaleDateString('es-BO')} · ${Math.round(Number(s.durationSeconds || 0) / 60)} min · ${Number(s.totalVolumeKg || 0).toFixed(0)} kg · ${s.totalCompletedSets || 0} series</p>
                                </div>
                            </div>
                            <button onclick="deleteDocItem('workout_sessions', '${s.docId}')" class="text-xs text-red-400">Eliminar</button>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
        return;
    }

    // 10. COACH IA
    if (wState.subScreen === 'COACH_IA') {
        const nextInfo = getTodayScheduledWorkoutInfo();
        container.innerHTML = `
            <div class="space-y-6">
                <div class="flex items-center justify-between">
                    <button onclick="openWorkoutSub('PRINCIPAL')" class="px-3.5 py-2 rounded-xl bg-[#181824] border border-[#28283C] text-xs font-bold">← Volver</button>
                    <h3 class="text-lg font-black">🤖 Vax Coach · Recomendación</h3>
                </div>
                <div class="p-6 rounded-3xl bg-white dark:bg-[#181824] border border-accent/40 space-y-4">
                    ${!nextInfo ? `
                        <p class="text-xs text-gray-300">Primero copia una plantilla o crea una rutina en tu biblioteca para que Vax Coach programe tu sesión de hoy.</p>
                    ` : `
                        <p class="text-xs text-gray-300 leading-relaxed">
                            Llevas <strong>${weekStats.count} de ${targetDays} sesiones</strong> completadas esta semana en tu rutina principal <strong>${nextInfo.routineName}</strong>.
                        </p>
                        <div class="p-4 rounded-2xl bg-[#0A0A0F] border border-[#28283C] flex items-center justify-between">
                            <div>
                                <span class="text-[10px] font-bold text-accent uppercase">Entrenamiento recomendado hoy</span>
                                <h4 class="text-base font-black mt-0.5">${nextInfo.dayName}</h4>
                                <p class="text-xs text-gray-400">${nextInfo.exercisesCount} ejercicios · ~${nextInfo.estimatedMin} min</p>
                            </div>
                            <button onclick="beginActiveWorkoutSession(${nextInfo.routineId}, ${nextInfo.dayNumber})" class="px-4 py-2.5 rounded-xl bg-accent text-white text-xs font-extrabold">▶ Entrenar</button>
                        </div>
                    `}
                </div>
            </div>
        `;
    }
}

function renderRoutineCard(r, mode = 'grid', isSystemTemplateCard = false) {
    const actionBtn = isSystemTemplateCard
        ? `<button onclick="event.stopPropagation(); copyTemplateToLibrary(${r.id})" class="flex-1 py-2 px-3 rounded-xl bg-emerald-600/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-600 hover:text-white text-xs font-bold transition-all">📥 Copiar a mi biblioteca</button>`
        : `<button onclick="event.stopPropagation(); selectPrimaryRoutine(${r.id})" class="flex-1 py-2 px-3 rounded-xl bg-accent/15 text-accent hover:bg-accent hover:text-white text-xs font-bold transition-all">★ Elegir Principal</button>`;

    if (mode === 'list') {
        return `
            <div onclick="openRoutineDetailView(${r.id})" class="p-4 rounded-2xl bg-white dark:bg-[#181824] border border-gray-200 dark:border-[#28283C] flex items-center justify-between gap-4 cursor-pointer hover:border-accent">
                <div class="flex items-center space-x-3.5">
                    <img src="${r.imageUri || pPush}" class="w-16 h-16 rounded-xl object-cover">
                    <div>
                        <h5 class="text-sm font-extrabold">${r.name}</h5>
                        <p class="text-xs text-gray-400 mt-0.5">${(r.days || []).length} días · ${r.focusCategory || 'Hipertrofia'}</p>
                    </div>
                </div>
                <div class="shrink-0">${actionBtn}</div>
            </div>
        `;
    }
    return `
        <div onclick="openRoutineDetailView(${r.id})" class="rounded-2xl overflow-hidden bg-white dark:bg-[#181824] border border-gray-200 dark:border-[#28283C] flex flex-col justify-between cursor-pointer hover:border-accent transition-all">
            <div class="h-36 bg-cover bg-center relative" style="background-image:url('${r.imageUri || pPush}')">
                <div class="absolute inset-0 bg-gradient-to-t from-[#181824] to-transparent"></div>
                <span class="absolute bottom-2 left-3 text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-accent text-white">${r.focusCategory || 'Hipertrofia'} · ${r.targetDaysPerWeek || 4}d</span>
            </div>
            <div class="p-5 flex-1 flex flex-col justify-between">
                <div>
                    <h5 class="font-extrabold text-sm">${r.name}</h5>
                    <p class="text-[11px] text-gray-400 mt-1 line-clamp-2">${r.description || ''}</p>
                </div>
                <div class="flex gap-2 mt-4">
                    ${actionBtn}
                </div>
            </div>
        </div>
    `;
}

// COPIAR PLANTILLA WEAVAX A MIS RUTINAS GUARDADAS
window.copyTemplateToLibrary = async (templateId) => {
    const tpl = WEAVAX_30_TEMPLATES.find(t => Number(t.id) === Number(templateId));
    if (!tpl) return;
    const newId = Date.now();
    const cloned = {
        ...tpl,
        id: newId,
        isSystemTemplate: false,
        createdAt: newId
    };
    await fsActions.setItem('workout_routines', newId, cloned);
    wState.selectedRoutineId = newId;
    localStorage.setItem('weavax_primary_routine_id', String(newId));
    wState.libraryTab = 'MIS_RUTINAS';
    wState.subScreen = 'PRINCIPAL';
    renderWorkouts();
};

window.selectPrimaryRoutine = (routineId) => {
    const existsInUserLib = getUserSavedRoutines().some(r => Number(r.id) === Number(routineId));
    if (!existsInUserLib) {
        return alert('Primero debes copiar esta plantilla a tu biblioteca para elegirla como principal.');
    }
    wState.selectedRoutineId = Number(routineId);
    localStorage.setItem('weavax_primary_routine_id', String(routineId));
    wState.subScreen = 'PRINCIPAL';
    renderWorkouts();
};

window.openWorkoutSub = (sub, tab) => {
    wState.subScreen = sub;
    if (tab) wState.libraryTab = tab;
    renderWorkouts();
};

window.setLibraryViewMode = (m) => { wState.viewMode = m; renderWorkouts(); };
window.setTemplateCategory = (c) => { wState.categoryFilter = c; renderWorkouts(); };
window.setMuscleBankFilter = (m) => { wState.muscleFilter = m; renderWorkouts(); };
window.filterExerciseBank = (q) => { wState.searchQuery = q; renderWorkouts(); };

window.openRoutineDetailView = (routineId) => {
    wState.viewingRoutine = getAllRoutinesAndTemplates().find(r => Number(r.id) === Number(routineId));
    wState.subScreen = 'DETALLE_RUTINA';
    renderWorkouts();
};

window.openDayDetailView = (routineId, dayNumber) => {
    const r = getAllRoutinesAndTemplates().find(x => Number(x.id) === Number(routineId));
    if (!r) return;
    wState.viewingRoutine = r;
    wState.viewingDayPlan = (r.days || []).find(d => Number(d.dayNumber) === Number(dayNumber)) || r.days[0];
    wState.subScreen = 'DETALLE_ENTRENAMIENTO';
    renderWorkouts();
};

window.showExerciseAnatomyModal = (exId) => {
    const ex = getExById(exId);
    window.openUniversalModal(ex.name, `
        <div class="space-y-3 text-center">
            <img src="${ex.img}" class="w-48 h-48 mx-auto rounded-2xl object-contain bg-white p-2">
            <div class="flex justify-center gap-2 text-xs font-bold">
                <span class="px-3 py-1 rounded-full bg-accent/20 text-accent">Músculo: ${ex.muscleGroup}</span>
                <span class="px-3 py-1 rounded-full bg-[#0A0A0F] border border-[#28283C]">Equipo: ${ex.equipment}</span>
            </div>
        </div>
    `);
};

// INICIAR SESIÓN ACTIVA (SIN DATOS BASURA: PESO Y REPS INICIAN EN 0)
window.beginActiveWorkoutSession = (routineId, dayNumber) => {
    const r = getAllRoutinesAndTemplates().find(x => Number(x.id) === Number(routineId));
    const d = (r?.days || []).find(x => Number(x.dayNumber) === Number(dayNumber)) || r?.days?.[0];
    if (!r || !d) return;

    window.navigate('workouts');

    const clonedExercises = (d.exercises || []).map(ex => {
        const cat = getExById(ex.exerciseId);
        const count = Number(ex.targetSets || 3);
        return {
            ...ex,
            imageUri: cat.img,
            sets: Array.from({ length: count }, (_, i) => ({
                setNumber: i + 1,
                setType: 'NORMAL',
                weightKg: 0,
                reps: 0,
                isCompleted: false
            }))
        };
    });

    wState.activeSession = {
        routineId: r.id,
        routineName: `${r.name} · ${d.dayName}`,
        dayNumber: d.dayNumber,
        startedAt: Date.now(),
        elapsedSeconds: 0,
        originalExercisesSnapshot: JSON.parse(JSON.stringify(d.exercises || [])),
        exercises: clonedExercises
    };

    if (wState.timerInterval) clearInterval(wState.timerInterval);
    wState.timerInterval = setInterval(() => {
        if (wState.activeSession) {
            wState.activeSession.elapsedSeconds++;
            const clock = document.getElementById('live-workout-clock');
            if (clock) {
                const m = String(Math.floor(wState.activeSession.elapsedSeconds / 60)).padStart(2, '0');
                const s = String(wState.activeSession.elapsedSeconds % 60).padStart(2, '0');
                clock.textContent = `${m}:${s}`;
            }
        }
    }, 1000);

    wState.subScreen = 'SESION_ACTIVA';
    renderWorkouts();
};

// MODAL CENTRADO PARA SELECCIONAR EL TIPO DE SERIE (NO SWITCH CIEGO)
window.openSetTypePickerModal = (exIdx, stIdx) => {
    const cur = wState.activeSession.exercises[exIdx].sets[stIdx].setType;
    const types = [
        { code: 'NORMAL', label: `Serie Normal (#${stIdx + 1})`, desc: 'Serie efectiva estándar de trabajo', color: 'text-white' },
        { code: 'W', label: 'W · Serie de Calentamiento (Warmup)', desc: 'Aproximación sin fatiga muscular', color: 'text-amber-400' },
        { code: 'D', label: 'D · Dropset (Serie Descendente)', desc: 'Reducción inmediata de peso sin descanso', color: 'text-cyan-400' },
        { code: 'F', label: 'F · Serie al Fallo Muscular', desc: 'Máximo esfuerzo hasta no poder completar otra rep', color: 'text-red-400' }
    ];

    window.openUniversalModal('Seleccionar Tipo de Serie', `
        <div class="space-y-2.5 text-xs">
            ${types.map(t => `
                <button onclick="selectSetTypeOption(${exIdx}, ${stIdx}, '${t.code}')" class="w-full p-3.5 rounded-2xl bg-[#0A0A0F] border ${cur === t.code ? 'border-accent bg-accent/10' : 'border-[#28283C]'} hover:border-accent text-left transition-all">
                    <p class="font-extrabold ${t.color}">${t.label}</p>
                    <p class="text-[11px] text-gray-400 mt-0.5">${t.desc}</p>
                </button>
            `).join('')}
        </div>
    `);
};

window.selectSetTypeOption = (exIdx, stIdx, code) => {
    wState.activeSession.exercises[exIdx].sets[stIdx].setType = code;
    window.closeUniversalModal();
    renderWorkouts();
};

window.updateActiveSetVal = (exIdx, stIdx, field, val) => {
    wState.activeSession.exercises[exIdx].sets[stIdx][field] = Math.max(0, Number(val || 0));
};

window.toggleActiveSetDone = (exIdx, stIdx) => {
    const st = wState.activeSession.exercises[exIdx].sets[stIdx];
    st.isCompleted = !st.isCompleted;
    if (st.isCompleted) {
        wState.restSecondsLeft = Number(wState.activeSession.exercises[exIdx].restSeconds || 90);
        if (wState.restInterval) clearInterval(wState.restInterval);
        wState.restInterval = setInterval(() => {
            wState.restSecondsLeft = Math.max(0, wState.restSecondsLeft - 1);
            if (wState.restSecondsLeft === 0) clearInterval(wState.restInterval);
            if (wState.subScreen === 'SESION_ACTIVA') renderWorkouts();
        }, 1000);
    }
    renderWorkouts();
};

window.addSetToActive = (exIdx) => {
    const sets = wState.activeSession.exercises[exIdx].sets;
    sets.push({ setNumber: sets.length + 1, setType: 'NORMAL', weightKg: 0, reps: 0, isCompleted: false });
    renderWorkouts();
};

window.removeLastSetFromActive = (exIdx) => {
    const sets = wState.activeSession.exercises[exIdx].sets;
    if (sets.length > 1) sets.pop();
    renderWorkouts();
};

window.removeExerciseFromActive = (exIdx) => {
    wState.activeSession.exercises.splice(exIdx, 1);
    renderWorkouts();
};

window.openAddExerciseToActiveModal = () => {
    window.openUniversalModal('Añadir Ejercicio a la Sesión', `
        <div class="max-h-80 overflow-y-auto space-y-2">
            ${EXERCISE_CATALOG.map(ex => `
                <button onclick="addExerciseToActiveSession(${ex.id})" class="w-full p-2.5 rounded-xl bg-[#0A0A0F] border border-[#28283C] flex items-center space-x-3 text-left hover:border-accent">
                    <img src="${ex.img}" class="w-10 h-10 rounded-lg bg-white p-0.5 object-contain">
                    <div><p class="text-xs font-bold">${ex.name}</p><p class="text-[10px] text-gray-400">${ex.muscleGroup}</p></div>
                </button>
            `).join('')}
        </div>
    `);
};

window.addExerciseToActiveSession = (exId) => {
    const cat = getExById(exId);
    wState.activeSession.exercises.push({
        exerciseId: cat.id,
        exerciseName: cat.name,
        muscleGroup: cat.muscleGroup,
        equipment: cat.equipment,
        imageUri: cat.img,
        restSeconds: 90,
        sets: [
            { setNumber: 1, setType: 'NORMAL', weightKg: 0, reps: 0, isCompleted: false },
            { setNumber: 2, setType: 'NORMAL', weightKg: 0, reps: 0, isCompleted: false },
            { setNumber: 3, setType: 'NORMAL', weightKg: 0, reps: 0, isCompleted: false }
        ]
    });
    window.closeUniversalModal();
    renderWorkouts();
};

window.attemptFinishWorkout = () => {
    const incompleteExercises = wState.activeSession.exercises.filter(ex => ex.sets.some(s => !s.isCompleted));
    if (incompleteExercises.length > 0) {
        window.openUniversalModal('Series sin marcar', `
            <div class="space-y-4 text-xs">
                <p class="font-bold text-gray-200">Tienes series sin marcar con el check (✓) en:</p>
                <ul class="space-y-1 text-gray-400 list-disc pl-5">
                    ${incompleteExercises.map(e => `<li>${e.exerciseName}</li>`).join('')}
                </ul>
                <p class="text-[11px] text-amber-300">Nota: Solo se contabilizarán en tus estadísticas las series que hayas marcado como completadas (✓).</p>
                <div class="flex gap-2 pt-2">
                    <button onclick="closeUniversalModal()" class="flex-1 py-2.5 rounded-xl bg-[#0A0A0F] border border-[#28283C] font-bold">Volver</button>
                    <button onclick="closeUniversalModal(); proceedToPorFinalizarScreen()" class="flex-1 py-2.5 rounded-xl bg-amber-500 text-black font-extrabold">Continuar</button>
                </div>
            </div>
        `);
    } else {
        proceedToPorFinalizarScreen();
    }
};

window.proceedToPorFinalizarScreen = () => {
    if (wState.timerInterval) clearInterval(wState.timerInterval);
    const totalSec = Math.max(1, wState.activeSession.elapsedSeconds);
    wState.finishDraft = {
        title: wState.activeSession.routineName,
        hours: Math.floor(totalSec / 3600),
        minutes: Math.floor((totalSec % 3600) / 60),
        seconds: totalSec % 60,
        photoDataUrl: '',
        notes: ''
    };
    wState.subScreen = 'POR_FINALIZAR';
    renderWorkouts();
};

window.handleWorkoutPhotoUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file || !wState.finishDraft) return;
    const reader = new FileReader();
    reader.onload = () => {
        wState.finishDraft.photoDataUrl = reader.result;
        renderWorkouts();
    };
    reader.readAsDataURL(file);
};

window.checkRoutineReconciliationBeforeSave = () => {
    const s = wState.activeSession;
    const orig = s.originalExercisesSnapshot || [];
    const cur = s.exercises || [];

    const diffs = [];
    if (cur.length > orig.length) diffs.push(`Has añadido ${cur.length - orig.length} ejercicio(s)`);
    if (cur.length < orig.length) diffs.push(`Has eliminado ${orig.length - cur.length} ejercicio(s)`);

    cur.forEach(cEx => {
        const match = orig.find(o => Number(o.exerciseId) === Number(cEx.exerciseId));
        if (match && cEx.sets.length !== Number(match.targetSets)) {
            const delta = cEx.sets.length - Number(match.targetSets);
            diffs.push(`${cEx.exerciseName}: ${delta > 0 ? `+${delta}` : delta} serie(s)`);
        }
    });

    if (diffs.length > 0 && getUserSavedRoutines().some(r => Number(r.id) === Number(s.routineId))) {
        window.openUniversalModal('Cambios en tu rutina', `
            <div class="space-y-4 text-xs text-center">
                <p class="text-gray-300">Detectamos cambios respecto a tu plantilla del Día ${s.dayNumber}:</p>
                <div class="p-3 rounded-xl bg-[#0A0A0F] border border-[#28283C] text-left space-y-1 text-gray-400">
                    ${diffs.map(d => `<p>• ${d}</p>`).join('')}
                </div>
                <div class="flex gap-2">
                    <button onclick="closeUniversalModal(); finalizeAndSaveWorkoutSession(false)" class="flex-1 py-2.5 rounded-xl bg-[#0A0A0F] border border-[#28283C] font-bold">Mantener Original</button>
                    <button onclick="closeUniversalModal(); finalizeAndSaveWorkoutSession(true)" class="flex-1 py-2.5 rounded-xl bg-accent text-white font-extrabold">Actualizar Rutina</button>
                </div>
            </div>
        `);
    } else {
        finalizeAndSaveWorkoutSession(false);
    }
};

// GUARDADO FINAL CON ESTADÍSTICAS 100% REALES (SOLO SERIES CON isCompleted === true)
window.finalizeAndSaveWorkoutSession = async (updateTemplate) => {
    const s = wState.activeSession;
    const title = document.getElementById('fin-title')?.value || s.routineName;
    const h = Number(document.getElementById('fin-h')?.value || 0);
    const m = Number(document.getElementById('fin-m')?.value || 0);
    const sec = Number(document.getElementById('fin-s')?.value || 0);
    const notes = document.getElementById('fin-notes')?.value || '';
    const photoDataUrl = wState.finishDraft?.photoDataUrl || '';
    const durationSeconds = Math.max(1, (h * 3600) + (m * 60) + sec);

    let totalVolumeKg = 0;
    let totalCompletedSets = 0;
    const prs = [];
    const breakdown = [];
    const workedMuscles = new Set();

    s.exercises.forEach(ex => {
        // SOLO contar series donde el usuario marcó explícitamente el check ✓
        const doneSets = ex.sets.filter(st => st.isCompleted === true);
        if (doneSets.length === 0) return;

        workedMuscles.add(ex.muscleGroup);
        totalCompletedSets += doneSets.length;
        let exVol = 0;
        let best1RM = 0;

        doneSets.forEach(st => {
            const w = Math.max(0, Number(st.weightKg || 0));
            const r = Math.max(0, Number(st.reps || 0));
            exVol += (w * r);
            if (w > 0 && r > 0) {
                const est1rm = w * (1 + r / 30);
                if (est1rm > best1RM) best1RM = est1rm;
            }
        });

        totalVolumeKg += exVol;
        if (best1RM > 0) {
            prs.push(`${ex.exerciseName}: 1RM real ${best1RM.toFixed(1)} kg`);
        }
        breakdown.push({ name: ex.exerciseName, sets: doneSets.length, vol: exVol.toFixed(0) });
    });

    const id = Date.now();
    await fsActions.setItem('workout_sessions', id, {
        routineId: s.routineId,
        routineName: title,
        dayNumber: s.dayNumber,
        startedAt: s.startedAt,
        endedAt: id,
        durationSeconds,
        totalVolumeKg,
        totalCompletedSets,
        photoDataUrl,
        xpEarned: 60,
        notes,
        isCompleted: true
    });

    if (updateTemplate) {
        const routine = getUserSavedRoutines().find(r => Number(r.id) === Number(s.routineId));
        if (routine) {
            const updatedDays = (routine.days || []).map(d => {
                if (Number(d.dayNumber) !== Number(s.dayNumber)) return d;
                return {
                    ...d,
                    exercises: s.exercises.map((ex, i) => ({
                        id: i + 1,
                        exerciseId: ex.exerciseId,
                        exerciseName: ex.exerciseName,
                        muscleGroup: ex.muscleGroup,
                        equipment: ex.equipment,
                        orderIndex: i,
                        targetSets: ex.sets.length,
                        targetRepsRange: "8-12",
                        restSeconds: ex.restSeconds || 90
                    }))
                };
            });
            await fsActions.setItem('workout_routines', routine.id, { ...routine, isSystemTemplate: false, days: updatedDays });
        }
    }

    const nextXp = Number(window.state.profile?.xp || 0) + 60;
    await fsActions.updateProfile({ xp: nextXp, level: Math.floor(nextXp / 100) + 1 });

    wState.summaryData = {
        title,
        photoDataUrl,
        volume: totalVolumeKg.toFixed(0),
        sets: totalCompletedSets,
        durationMin: Math.max(1, Math.round(durationSeconds / 60)),
        muscles: Array.from(workedMuscles),
        prs,
        breakdown
    };
    wState.summarySlideIdx = 0;
    wState.activeSession = null;
    wState.subScreen = 'RESUMEN_SESION';
    renderWorkouts();
};

window.stepSummarySlide = (delta) => {
    wState.summarySlideIdx = (wState.summarySlideIdx + delta + 5) % 5;
    renderWorkouts();
};

window.discardActiveWorkout = () => {
    if (!confirm('¿Estás seguro de descartar este entrenamiento? No se guardará ningún dato.')) return;
    if (wState.timerInterval) clearInterval(wState.timerInterval);
    if (wState.restInterval) clearInterval(wState.restInterval);
    wState.activeSession = null;
    wState.finishDraft = null;
    wState.subScreen = 'PRINCIPAL';
    renderWorkouts();
};

window.openRoutineCreatorModal = () => {
    window.openUniversalModal('Crear Nueva Rutina', `
        <form onsubmit="saveNewUserRoutine(event)" class="space-y-3 text-xs">
            <input id="nr-name" required placeholder="Nombre de tu rutina" class="w-full px-3.5 py-2.5 rounded-xl bg-[#0A0A0F] border border-[#28283C]">
            <input id="nr-desc" placeholder="Descripción" class="w-full px-3.5 py-2.5 rounded-xl bg-[#0A0A0F] border border-[#28283C]">
            <div class="grid grid-cols-2 gap-2">
                <select id="nr-focus" class="px-3 py-2.5 rounded-xl bg-[#0A0A0F] border border-[#28283C]">
                    <option value="Hipertrofia">Hipertrofia</option><option value="Fuerza">Fuerza</option><option value="Calistenia">Calistenia</option>
                </select>
                <input id="nr-days" type="number" min="1" max="7" value="4" placeholder="Días/sem" class="px-3 py-2.5 rounded-xl bg-[#0A0A0F] border border-[#28283C]">
            </div>
            <input id="nr-day1" value="Día 1: Entrenamiento A" placeholder="Nombre del Día 1" class="w-full px-3.5 py-2.5 rounded-xl bg-[#0A0A0F] border border-[#28283C]">
            <button type="submit" class="w-full py-2.5 rounded-xl bg-accent text-white font-bold">Guardar en Mis Rutinas</button>
        </form>
    `);
};

window.saveNewUserRoutine = async (e) => {
    e.preventDefault();
    const id = Date.now();
    const day1Name = document.getElementById('nr-day1').value.trim() || 'Día 1';
    await fsActions.setItem('workout_routines', id, {
        name: document.getElementById('nr-name').value.trim(),
        description: document.getElementById('nr-desc').value.trim(),
        focusCategory: document.getElementById('nr-focus').value,
        targetDaysPerWeek: Number(document.getElementById('nr-days').value || 4),
        isSystemTemplate: false,
        imageUri: pPush,
        days: [mkDay(1, day1Name, pPush, [[1,4,"8-10",90],[14,4,"8-10",90],[43,4,"12-15",60]])]
    });
    window.closeUniversalModal();
    wState.selectedRoutineId = id;
    localStorage.setItem('weavax_primary_routine_id', String(id));
    renderWorkouts();
};
