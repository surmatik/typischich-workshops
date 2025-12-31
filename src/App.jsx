import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useParams } from 'react-router-dom';
import { databases, DATABASE_ID, WORKSHOP_COLLECTION_ID, PARTICIPANT_COLLECTION_ID } from './lib/appwrite';
import { Query, ID } from 'appwrite';

function WorkshopApp() {
  const { token } = useParams();
  
  // States für Daten
  const [workshop, setWorkshop] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // UI States
  const [showSizeGuide, setShowSizeGuide] = useState(false); // Fix: Fehlender State hinzugefügt

  // Formular States
  const [name, setName] = useState('');
  const [product, setProduct] = useState('T-Shirt');
  const [size, setSize] = useState('');
  const [color, setColor] = useState('');

  const PRICE_TSHIRT = 85;
  const PRICE_BAG = 75;
  const VARIANT_ID_TSHIRT = "53578288136521";
  const VARIANT_ID_BAG = "53578298949961";

  useEffect(() => { 
    if (token) {
      fetchData(); 
    } else {
      setLoading(false);
      setError(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  async function fetchData() {
    try {
      setLoading(true);
      // 1. Workshop über Token finden
      const workshopRes = await databases.listDocuments(
        DATABASE_ID,
        WORKSHOP_COLLECTION_ID,
        [Query.equal('token', token)]
      );

      if (workshopRes.documents.length === 0) {
        setError(true);
        setLoading(false);
        return;
      }

      const currentWorkshop = workshopRes.documents[0];
      setWorkshop(currentWorkshop);

      // 2. Teilnehmer laden (Filter auf das Relations-Feld 'workshops')
      const participantsRes = await databases.listDocuments(
        DATABASE_ID,
        PARTICIPANT_COLLECTION_ID,
        [Query.equal('workshops', currentWorkshop.$id)]
      );
      
      setParticipants(participantsRes.documents);
    } catch (err) {
      console.error("Fetch Error:", err);
      setError(true);
    } finally {
      setLoading(false);
    }
  }

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('de-CH');
  };

  async function addParticipant() {
    if (participants.length >= (workshop?.persons_count || 0)) return;
    if (!name || (product === 'T-Shirt' && (!size || !color))) return;

    setIsSubmitting(true);
    try {
      const newParticipantData = {
        name,
        product,
        size: product === 'T-Shirt' ? size : '-',
        color: product === 'T-Shirt' ? color : '-',
        workshops: workshop.$id 
      };

      const response = await databases.createDocument(
        DATABASE_ID,
        PARTICIPANT_COLLECTION_ID,
        ID.unique(),
        newParticipantData
      );

      setParticipants([...participants, response]);
      // Reset Form
      setName(''); 
      setSize(''); 
      setColor('');
    } catch (err) {
      console.error("Create Error:", err);
      alert("Fehler beim Speichern des Teilnehmers.");
    } finally {
      setIsSubmitting(false);
    }
  }

  const getCheckoutLink = () => {
    const tshirtCount = participants.filter(p => p.product === 'T-Shirt').length;
    const bagCount = participants.filter(p => p.product === 'Filzbag').length;
    let items = [];
    if (tshirtCount > 0) items.push(`${VARIANT_ID_TSHIRT}:${tshirtCount}`);
    if (bagCount > 0) items.push(`${VARIANT_ID_BAG}:${bagCount}`);
    return `https://typischich.ch/cart/${items.join(',')}`;
  };

  if (loading) return <div className="flex h-screen items-center justify-center text-xs tracking-widest uppercase text-gray-300 font-sans">Lade Workshop...</div>;

  if (error) return (
    <div className="flex h-screen flex-col items-center justify-center bg-[#F0F2F5] px-4 text-center font-sans">
      <h1 className="text-4xl font-black mb-2 tracking-tighter">HOPPLA!</h1>
      <p className="text-gray-500 text-sm mb-8">Dieser Link ist ungültig oder der Workshop existiert nicht mehr.</p>
      <a href="https://typischich.ch" className="bg-black text-white px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg">Zur Startseite</a>
    </div>
  );

  const tshirtCount = participants.filter(p => p.product === 'T-Shirt').length;
  const bagCount = participants.filter(p => p.product === 'Filzbag').length;
  const totalAmount = (tshirtCount * PRICE_TSHIRT) + (bagCount * PRICE_BAG);
  
  const isComplete = participants.length >= (workshop?.persons_count || 0);
  const diff = (workshop?.persons_count || 0) - participants.length;

  return (
    <div className="min-h-screen bg-[#F0F2F5] text-[#2c2c2c] font-sans antialiased py-8 px-4 flex flex-col">
      <div className="max-w-4xl mx-auto space-y-6 flex-grow w-full">
        
        <div className="flex justify-between items-center px-4">
          <img src="https://typischich.ch/cdn/shop/files/logo_black.png?v=1740907843&width=140" alt="Logo" className="h-10 w-auto opacity-80" />
          <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Typisch Ich - Workshops</span>
        </div>

        <section className="bg-white rounded-3xl p-8 border border-gray-200 shadow-sm">
          <h1 className="text-3xl font-bold mb-1 tracking-tight">{workshop?.name}</h1>
          <p className="text-gray-400 text-sm font-medium">{formatDate(workshop?.date)}</p>
        </section>

        {!isComplete && (
          <section className="bg-white rounded-3xl p-8 border border-gray-200 shadow-sm">
            <h2 className="text-lg font-bold mb-6">Teilnehmer hinzufügen</h2>
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-gray-400 ml-1">Name</label>
                  <input value={name} onChange={(e) => setName(e.target.value)} placeholder="z. B. Lara" className="w-full bg-[#F9FAFB] border border-gray-200 p-3 rounded-xl outline-none focus:bg-white focus:ring-2 focus:ring-black/5 transition-all text-sm font-medium" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-gray-400 ml-1">Produkt</label>
                  <div className="flex gap-2 p-1.5 bg-[#F9FAFB] border border-gray-200 rounded-xl">
                    <button onClick={() => setProduct('T-Shirt')} className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all ${product === 'T-Shirt' ? 'bg-white shadow-sm border border-gray-100' : 'opacity-40'}`}>T-Shirt</button>
                    <button onClick={() => setProduct('Filzbag')} className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all ${product === 'Filzbag' ? 'bg-white shadow-sm border border-gray-100' : 'opacity-40'}`}>Filzbag</button>
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap md:flex-nowrap items-end gap-4">
                {product === 'T-Shirt' ? (
                  <>
                    <div className="flex-1 space-y-2 min-w-[120px]">
                      <label className="text-[10px] font-black uppercase text-gray-400 ml-1">Farbe</label>
                      <select value={color} onChange={(e) => setColor(e.target.value)} className="w-full bg-[#F9FAFB] border border-gray-200 p-3 rounded-xl outline-none text-sm font-medium">
                        <option value="">Wählen...</option>
                        <option value="Weiss">Weiss</option>
                        <option value="Dunkelgrau">Dunkelgrau</option>
                        <option value="Schwarz">Schwarz</option>
                      </select>
                    </div>
                    <div className="flex-1 space-y-2 min-w-[150px]">
                      <label className="text-[10px] font-black uppercase text-gray-400 ml-1">Grösse</label>
                      <select value={size} onChange={(e) => setSize(e.target.value)} className="w-full bg-[#F9FAFB] border border-gray-200 p-3 rounded-xl outline-none text-sm font-medium">
                        <option value="">Wählen...</option>
                        <option value="XS (Frauengrösse)">XS (Frau)</option>
                        <option value="S">S</option><option value="M">M</option><option value="L">L</option><option value="XL">XL</option><option value="XXL">XXL</option>
                        <option value="3XL (Herrengrösse)">3XL (Herr)</option>
                      </select>
                    </div>
                  </>
                ) : <div className="flex-1 text-sm text-gray-300 italic pb-3">Keine weiteren Optionen nötig.</div>}
                <button 
                  onClick={addParticipant} 
                  disabled={isSubmitting}
                  className="w-full md:w-48 bg-black text-white py-3.5 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-gray-800 transition-all shadow-md disabled:opacity-50"
                >
                  {isSubmitting ? 'Lädt...' : '+ Hinzufügen'}
                </button>
              </div>
            </div>

            {product === 'T-Shirt' && (
                <div className="border border-gray-100 rounded-2xl overflow-hidden mt-6">
                  <button onClick={() => setShowSizeGuide(!showSizeGuide)} className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 transition-colors text-[10px] font-black uppercase text-gray-500 tracking-widest">
                    Grössentabelle anzeigen
                    <span className={`text-lg transition-transform duration-300 ${showSizeGuide ? 'rotate-180' : ''}`}>↓</span>
                  </button>
                  {showSizeGuide && (
                    <div className="p-4 bg-white grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in duration-300">
                      <div className="space-y-2">
                         <img src="https://strapi.prod-strapi-fra-01.surmatik.ch/uploads/T_Shirt_Groessenangaben_Frauen_5a6a8414c2.png" alt="Frauen" className="w-full h-auto rounded-lg border border-gray-100" />
                      </div>
                      <div className="space-y-2">
                         <img src="https://strapi.prod-strapi-fra-01.surmatik.ch/uploads/T_Shirt_Groessenangaben_Herren_6a23b8e615.png" alt="Herren" className="w-full h-auto rounded-lg border border-gray-100" />
                      </div>
                    </div>
                  )}
                </div>
              )}
          </section>
        )}

        <section className="bg-white rounded-3xl p-8 border border-gray-200 shadow-sm">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-lg font-bold">Teilnehmer</h2>
            <div className="bg-gray-50 border border-gray-100 px-4 py-2 rounded-full text-sm font-black">
              {participants.length}/{workshop?.persons_count} erfasst
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-[10px] font-black uppercase tracking-widest text-gray-400 border-b border-gray-50">
                  <th className="pb-4">Name</th>
                  <th className="pb-4">Produkt</th>
                  <th className="pb-4 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {participants.length === 0 ? (
                  <tr><td colSpan="3" className="py-12 text-center text-xs text-gray-300 font-bold uppercase tracking-widest">Noch keine Einträge</td></tr>
                ) : (
                  participants.map((p) => (
                    <tr key={p.$id} className="text-sm">
                      <td className="py-4 font-bold">{p.name}</td>
                      <td className="py-4 text-gray-500 font-medium">{p.product}</td>
                      <td className="py-4 text-right">
                        <span className="text-[10px] font-bold uppercase bg-gray-50 px-2 py-1 rounded text-gray-400 border border-gray-100">
                          {p.product === 'T-Shirt' ? `${p.color} / ${p.size}` : '-'}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="bg-white rounded-3xl p-8 border border-gray-200 shadow-sm space-y-8">
          <div className="flex flex-col md:flex-row justify-between items-end gap-8">
            <div className="w-full md:w-1/2 space-y-4">
              <h2 className="text-lg font-bold mb-4">Abrechnung</h2>
              <div className="flex justify-between items-center text-sm border-b border-gray-50 pb-2">
                <div className="flex flex-col">
                  <span>T-Shirts (x{tshirtCount})</span>
                  <span className="text-[12px] text-gray-400 font-medium">CHF {PRICE_TSHIRT}</span>
                </div>
                <span className="font-bold text-gray-400">CHF {tshirtCount * PRICE_TSHIRT}</span>
              </div>
              <div className="flex justify-between items-center text-sm border-b border-gray-50 pb-2">
                <div className="flex flex-col">
                  <span>Filzbags (x{bagCount})</span>
                  <span className="text-[12px] text-gray-400 font-medium">CHF {PRICE_BAG}</span>
                </div>
                <span className="font-bold text-gray-400">CHF {bagCount * PRICE_BAG}</span>
              </div>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Gesamtbetrag</p>
              <div className="flex items-baseline justify-end gap-1">
                <span className="text-sm font-bold text-gray-300 italic">CHF</span>
                <span className="text-4xl font-black tracking-tighter">{totalAmount}</span>
              </div>
            </div>
          </div>

          <div className="pt-4">
            <a 
              href={isComplete ? getCheckoutLink() : '#'} 
              className={`w-full flex items-center justify-center gap-3 py-5 rounded-2xl text-lg font-bold tracking-wider transition-all shadow-xl ${
                isComplete 
                ? 'bg-[#25D366] text-white hover:bg-[#1eb957] active:scale-[0.98]' 
                : 'bg-gray-100 text-gray-400 cursor-not-allowed grayscale shadow-none pointer-events-none'
              }`}
            >
              {isComplete ? (
                'Jetzt bezahlen - dann ist alles erledigt 👍'
              ) : (
                <span>
                  Ui, da {diff === 1 ? 'fehlt' : 'fehlen'} noch {diff} {diff === 1 ? 'Person' : 'Personen'} 😀
                </span>
              )}
            </a>
          </div>
        </section>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/:token" element={<WorkshopApp />} />
        <Route path="/" element={<div className="flex h-screen items-center justify-center text-gray-400 font-sans">Bitte Link aus Einladung nutzen.</div>} />
        <Route path="*" element={<div className="flex h-screen items-center justify-center text-gray-400 font-sans">Seite nicht gefunden.</div>} />
      </Routes>
    </Router>
  );
}