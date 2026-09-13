import React, { useState } from 'react';
import {
  Plane,
  Calendar,
  MapPin,
  Plus,
  CheckCircle2,
  Circle,
  Luggage,
  Sparkles,
  Trash2,
  DollarSign,
  Compass,
  ExternalLink,
  Edit3,
  Check,
  Navigation,
  Loader2,
  Clock,
  ArrowRight,
} from 'lucide-react';
import { TripPlan, PartnerId, CoupleProfile, TravelWishlistPlace, TravelItineraryDay } from '../types';

interface TravelPlannerViewProps {
  trips: TripPlan[];
  profile: CoupleProfile;
  activePartner: PartnerId;
  onAddTrip: (trip: Omit<TripPlan, 'id'>) => void;
  onUpdateTrip: (trip: TripPlan) => void;
  onDeleteTrip: (id: string) => void;
}

export const TravelPlannerView: React.FC<TravelPlannerViewProps> = ({
  trips,
  profile,
  activePartner,
  onAddTrip,
  onUpdateTrip,
  onDeleteTrip,
}) => {
  const [selectedTrip, setSelectedTrip] = useState<TripPlan | null>(null);
  const [activeTab, setActiveTab] = useState<'itinerary' | 'places' | 'luggage' | 'budget'>('itinerary');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingTrip, setEditingTrip] = useState<TripPlan | null>(null);
  const [tripToDelete, setTripToDelete] = useState<TripPlan | null>(null);

  // New trip form state
  const [newTitle, setNewTitle] = useState('');
  const [newDestination, setNewDestination] = useState('');
  const [newStartDate, setNewStartDate] = useState('');
  const [newEndDate, setNewEndDate] = useState('');
  const [newCoverUrl, setNewCoverUrl] = useState('');
  const [newBudget, setNewBudget] = useState('');
  const [newNotes, setNewNotes] = useState('');

  // Edit trip form state
  const [editTitle, setEditTitle] = useState('');
  const [editDestination, setEditDestination] = useState('');
  const [editStartDate, setEditStartDate] = useState('');
  const [editEndDate, setEditEndDate] = useState('');
  const [editCoverUrl, setEditCoverUrl] = useState('');
  const [editBudget, setEditBudget] = useState('');
  const [editSpent, setEditSpent] = useState('');
  const [editStatus, setEditStatus] = useState<TripPlan['status']>('planejando');
  const [editNotes, setEditNotes] = useState('');

  // Luggage state inside modal
  const [newLuggageItem, setNewLuggageItem] = useState('');
  const [newLuggageAssignee, setNewLuggageAssignee] = useState<'partner1' | 'partner2' | 'ambos'>('ambos');
  const [luggageFilter, setLuggageFilter] = useState<'all' | 'partner1' | 'partner2' | 'ambos'>('all');

  // Place state inside modal
  const [newPlaceName, setNewPlaceName] = useState('');
  const [newPlaceCategory, setNewPlaceCategory] = useState('Passeio Romântico');
  const [newPlaceNotes, setNewPlaceNotes] = useState('');
  const [newPlaceLink, setNewPlaceLink] = useState('');
  const [isAddingPlace, setIsAddingPlace] = useState(false);

  // Itinerary day state inside modal
  const [newActivityText, setNewActivityText] = useState('');
  const [selectedDayId, setSelectedDayId] = useState<string | null>(null);

  // AI Generation State
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiMessage, setAiMessage] = useState<string | null>(null);

  // Normalization Helpers
  const getTripCover = (trip: TripPlan) => {
    return (
      trip.coverPhoto ||
      trip.coverUrl ||
      'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1000&q=80'
    );
  };

  const getTripBudget = (trip: TripPlan) => trip.estimatedBudget ?? trip.budget ?? 0;
  const getTripSpent = (trip: TripPlan) => trip.spentBudget ?? trip.spent ?? 0;

  const getTripWishlistPlaces = (trip: TripPlan): TravelWishlistPlace[] => {
    if (Array.isArray(trip.wishlistPlaces) && trip.wishlistPlaces.length > 0) {
      return trip.wishlistPlaces.map((p, idx) => ({
        id: p.id || `wp-${idx}`,
        name: p.name,
        category: p.category || 'Passeio a Dois',
        notes: p.notes || '',
        link:
          p.link ||
          `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(p.name + ' ' + trip.destination)}`,
        visited: Boolean(p.visited),
      }));
    }
    if (Array.isArray(trip.placesToVisit) && trip.placesToVisit.length > 0) {
      return trip.placesToVisit.map((p, idx) => {
        if (typeof p === 'string') {
          return {
            id: `wp-${idx}`,
            name: p,
            category: 'Passeio a Dois',
            notes: 'Lugar indicado para visitarmos juntinhos.',
            link: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(p + ' ' + trip.destination)}`,
            visited: false,
          };
        }
        return {
          id: p.id || `wp-${idx}`,
          name: p.name,
          category: p.category || 'Passeio a Dois',
          notes: p.notes || '',
          link:
            p.link ||
            `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(p.name + ' ' + trip.destination)}`,
          visited: Boolean(p.visited),
        };
      });
    }
    return [];
  };

  const getTripItinerary = (trip: TripPlan): TravelItineraryDay[] => {
    if (Array.isArray(trip.itinerary) && trip.itinerary.length > 0) {
      return trip.itinerary;
    }
    if (Array.isArray(trip.itineraryDays) && trip.itineraryDays.length > 0) {
      return trip.itineraryDays;
    }
    return [];
  };

  const handleCreateTrip = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newDestination.trim() || !newStartDate) return;

    const dest = newDestination.trim();
    const cleanBudget = newBudget ? parseFloat(newBudget) : 0;

    const newTrip: Omit<TripPlan, 'id'> = {
      title: newTitle.trim(),
      destination: dest,
      startDate: newStartDate,
      endDate: newEndDate || newStartDate,
      coverPhoto:
        newCoverUrl.trim() ||
        'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80',
      coverUrl:
        newCoverUrl.trim() ||
        'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80',
      status: 'planejando',
      estimatedBudget: cleanBudget,
      spentBudget: 0,
      budget: cleanBudget,
      spent: 0,
      luggageChecklist: [
        { id: `l-${Date.now()}-1`, item: 'Carregadores e adaptadores de tomada', assignedTo: 'ambos', packed: false },
        { id: `l-${Date.now()}-2`, item: 'Kit de remédios e primeiros socorros', assignedTo: 'ambos', packed: false },
        { id: `l-${Date.now()}-3`, item: 'Protetor solar e repelente', assignedTo: 'ambos', packed: false },
        { id: `l-${Date.now()}-4`, item: 'Documentos, reservas e passagens', assignedTo: 'ambos', packed: false },
      ],
      wishlistPlaces: [
        {
          id: `wp-${Date.now()}-1`,
          name: `Centro e Mirante de ${dest}`,
          category: 'Passeio Romântico',
          notes: 'Passear no centrinho e tirar fotos no mirante.',
          link: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent('centro ' + dest)}`,
          visited: false,
        },
      ],
      itinerary: [
        {
          id: `it-${Date.now()}-1`,
          day: 1,
          date: newStartDate,
          title: `Chegada & Primeiro Brinde em ${dest}`,
          activities: [
            'Viagem até o destino com playlist especial do casal',
            'Check-in na hospedagem e descanso aconchegante',
            'Primeiro jantar romântico para brindar a viagem',
          ],
        },
      ],
      notes: newNotes.trim() || undefined,
      addedBy: activePartner,
    };

    onAddTrip(newTrip);

    setNewTitle('');
    setNewDestination('');
    setNewStartDate('');
    setNewEndDate('');
    setNewCoverUrl('');
    setNewBudget('');
    setNewNotes('');
    setIsAddModalOpen(false);
  };

  const openEditTripModal = (trip: TripPlan) => {
    setEditingTrip(trip);
    setEditTitle(trip.title);
    setEditDestination(trip.destination);
    setEditStartDate(trip.startDate);
    setEditEndDate(trip.endDate);
    setEditCoverUrl(getTripCover(trip));
    setEditBudget(String(getTripBudget(trip) || ''));
    setEditSpent(String(getTripSpent(trip) || ''));
    setEditStatus(trip.status || 'planejando');
    setEditNotes(trip.notes || '');
  };

  const handleSaveTripEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTrip || !editTitle.trim() || !editDestination.trim()) return;

    const b = editBudget ? parseFloat(editBudget) : 0;
    const s = editSpent ? parseFloat(editSpent) : 0;

    const updated: TripPlan = {
      ...editingTrip,
      title: editTitle.trim(),
      destination: editDestination.trim(),
      startDate: editStartDate,
      endDate: editEndDate || editStartDate,
      coverPhoto: editCoverUrl.trim() || getTripCover(editingTrip),
      coverUrl: editCoverUrl.trim() || getTripCover(editingTrip),
      estimatedBudget: b,
      spentBudget: s,
      budget: b,
      spent: s,
      status: editStatus,
      notes: editNotes.trim() || undefined,
    };

    onUpdateTrip(updated);
    if (selectedTrip?.id === updated.id) {
      setSelectedTrip(updated);
    }
    setEditingTrip(null);
  };

  const handleToggleLuggage = (trip: TripPlan, luggageId: string) => {
    const updatedChecklist = trip.luggageChecklist.map((l) =>
      l.id === luggageId ? { ...l, packed: !l.packed } : l
    );
    const updatedTrip: TripPlan = { ...trip, luggageChecklist: updatedChecklist };
    onUpdateTrip(updatedTrip);
    setSelectedTrip(updatedTrip);
  };

  const handleAddLuggageItem = (trip: TripPlan) => {
    if (!newLuggageItem.trim()) return;
    const newItem = {
      id: `lug-${Date.now()}`,
      item: newLuggageItem.trim(),
      assignedTo: newLuggageAssignee,
      packed: false,
    };
    const updatedTrip: TripPlan = {
      ...trip,
      luggageChecklist: [...trip.luggageChecklist, newItem],
    };
    onUpdateTrip(updatedTrip);
    setSelectedTrip(updatedTrip);
    setNewLuggageItem('');
  };

  const handleDeleteLuggageItem = (trip: TripPlan, luggageId: string) => {
    const updatedTrip: TripPlan = {
      ...trip,
      luggageChecklist: trip.luggageChecklist.filter((l) => l.id !== luggageId),
    };
    onUpdateTrip(updatedTrip);
    setSelectedTrip(updatedTrip);
  };

  const handleTogglePlaceVisited = (trip: TripPlan, placeId: string) => {
    const currentPlaces = getTripWishlistPlaces(trip);
    const updatedPlaces = currentPlaces.map((p) =>
      p.id === placeId ? { ...p, visited: !p.visited } : p
    );
    const updatedTrip: TripPlan = {
      ...trip,
      wishlistPlaces: updatedPlaces,
      placesToVisit: updatedPlaces,
    };
    onUpdateTrip(updatedTrip);
    setSelectedTrip(updatedTrip);
  };

  const handleAddPlace = (trip: TripPlan) => {
    if (!newPlaceName.trim()) return;
    const currentPlaces = getTripWishlistPlaces(trip);
    const name = newPlaceName.trim();
    const link =
      newPlaceLink.trim() ||
      `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(name + ' ' + trip.destination)}`;

    const newPlace: TravelWishlistPlace = {
      id: `wp-${Date.now()}`,
      name,
      category: newPlaceCategory,
      notes: newPlaceNotes.trim() || 'Lugar lindo indicado para visitarmos juntos.',
      link,
      visited: false,
    };

    const updatedTrip: TripPlan = {
      ...trip,
      wishlistPlaces: [...currentPlaces, newPlace],
      placesToVisit: [...currentPlaces, newPlace],
    };

    onUpdateTrip(updatedTrip);
    setSelectedTrip(updatedTrip);

    setNewPlaceName('');
    setNewPlaceNotes('');
    setNewPlaceLink('');
    setIsAddingPlace(false);
  };

  const handleDeletePlace = (trip: TripPlan, placeId: string) => {
    const currentPlaces = getTripWishlistPlaces(trip);
    const updatedPlaces = currentPlaces.filter((p) => p.id !== placeId);
    const updatedTrip: TripPlan = {
      ...trip,
      wishlistPlaces: updatedPlaces,
      placesToVisit: updatedPlaces,
    };
    onUpdateTrip(updatedTrip);
    setSelectedTrip(updatedTrip);
  };

  const handleAddActivityToDay = (trip: TripPlan, dayId: string) => {
    if (!newActivityText.trim()) return;
    const currentItinerary = getTripItinerary(trip);
    const updatedItinerary = currentItinerary.map((d) => {
      if (d.id === dayId) {
        return {
          ...d,
          activities: [...d.activities, newActivityText.trim()],
        };
      }
      return d;
    });

    const updatedTrip: TripPlan = {
      ...trip,
      itinerary: updatedItinerary,
      itineraryDays: updatedItinerary,
    };

    onUpdateTrip(updatedTrip);
    setSelectedTrip(updatedTrip);
    setNewActivityText('');
    setSelectedDayId(null);
  };

  // AI Suggestion Handler
  const handleAiSuggestItinerary = async (trip: TripPlan) => {
    setIsAiLoading(true);
    setAiMessage(null);

    try {
      const response = await fetch('/api/trips/suggest-itinerary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          destination: trip.destination,
          title: trip.title,
          daysCount: getTripItinerary(trip).length || 3,
        }),
      });

      if (!response.ok) {
        throw new Error('Falha ao comunicar com o assistente de viagens');
      }

      const data = await response.json();
      const newPlaces: TravelWishlistPlace[] = data.placesToVisit || [];
      const newItinerary: TravelItineraryDay[] = data.itinerary || [];

      // Merge with existing
      const existingPlaces = getTripWishlistPlaces(trip);
      const existingPlaceNames = new Set(existingPlaces.map((p) => p.name.toLowerCase()));
      const mergedPlaces = [
        ...existingPlaces,
        ...newPlaces.filter((p) => !existingPlaceNames.has(p.name.toLowerCase())),
      ];

      const existingItinerary = getTripItinerary(trip);
      const mergedItinerary = existingItinerary.length > 0 ? existingItinerary : newItinerary;

      const updatedTrip: TripPlan = {
        ...trip,
        wishlistPlaces: mergedPlaces,
        placesToVisit: mergedPlaces,
        itinerary: mergedItinerary,
        itineraryDays: mergedItinerary,
      };

      onUpdateTrip(updatedTrip);
      setSelectedTrip(updatedTrip);
      setAiMessage(`✨ A IA adicionou ${newPlaces.length} lugares incríveis com links no Google Maps e um roteiro romântico!`);
      setTimeout(() => setAiMessage(null), 5000);
    } catch (err: any) {
      console.error(err);
      setAiMessage('Não foi possível gerar no momento. Tente novamente!');
    } finally {
      setIsAiLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-serif text-2xl font-bold text-[#2D2327] dark:text-[#FAF4F0]">
            Nossas Viagens & Roteiros dos Sonhos
          </h2>
          <p className="text-xs sm:text-sm text-[#7D6F74] dark:text-[#B8A8AF] mt-0.5">
            Planejamento compartilhado de destinos, roteiros dia a dia com links no Google Maps e malas conjuntas.
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-[#E07A8B] hover:bg-[#d66a7b] text-white font-medium text-xs sm:text-sm shadow-xs transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Planejar Nova Viagem</span>
        </button>
      </div>

      {/* Trips Grid */}
      {trips.length === 0 ? (
        <div className="py-16 text-center rounded-3xl bg-white dark:bg-[#241C21] border border-[#F2E8E4] dark:border-[#3D2F36]">
          <Plane className="w-10 h-10 mx-auto text-[#E07A8B]/60 mb-2" />
          <p className="text-sm font-semibold text-[#2D2327] dark:text-[#FAF4F0]">
            Nenhuma viagem cadastrada ainda
          </p>
          <p className="text-xs text-[#7D6F74] dark:text-[#B8A8AF] mt-1">
            Qual será o próximo refúgio romântico de vocês?
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {trips.map((trip) => {
            const packedCount = trip.luggageChecklist.filter((l) => l.packed).length;
            const totalLuggage = trip.luggageChecklist.length;
            const places = getTripWishlistPlaces(trip);
            const itinerary = getTripItinerary(trip);
            const budget = getTripBudget(trip);
            const cover = getTripCover(trip);

            return (
              <div
                key={trip.id}
                className="group flex flex-col rounded-3xl bg-white dark:bg-[#241C21] border border-[#F2E8E4] dark:border-[#3D2F36] overflow-hidden shadow-xs hover:shadow-md transition-all"
              >
                {/* Cover Image */}
                <div className="relative h-48 w-full overflow-hidden bg-zinc-100 dark:bg-zinc-800">
                  <img
                    src={cover}
                    alt={trip.title}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

                  {/* Destination pill */}
                  <div className="absolute top-3 left-3 flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-white/90 dark:bg-black/80 text-zinc-900 dark:text-zinc-100 backdrop-blur-xs flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-[#E07A8B]" />
                      <span>{trip.destination}</span>
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-rose-500 text-white">
                      {trip.status}
                    </span>
                  </div>

                  {/* Action buttons on card top right */}
                  <div className="absolute top-3 right-3 flex items-center gap-1.5">
                    <button
                      onClick={() => openEditTripModal(trip)}
                      className="p-1.5 rounded-full bg-black/50 text-white hover:bg-black/80 transition-colors"
                      title="Editar detalhes da viagem"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setTripToDelete(trip)}
                      className="p-1.5 rounded-full bg-black/50 text-white/80 hover:text-rose-400 hover:bg-black/80 transition-colors"
                      title="Excluir viagem"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="absolute bottom-3 left-3 right-3">
                    <h3 className="font-serif font-bold text-lg text-white leading-snug line-clamp-1">
                      {trip.title}
                    </h3>
                    <div className="flex items-center gap-2 text-xs text-zinc-300 mt-0.5">
                      <Calendar className="w-3.5 h-3.5 text-[#E07A8B]" />
                      <span>
                        {new Date(trip.startDate + 'T00:00:00').toLocaleDateString('pt-BR')} até{' '}
                        {new Date(trip.endDate + 'T00:00:00').toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Details */}
                <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                  <div className="space-y-2 text-xs sm:text-sm">
                    {trip.notes && (
                      <p className="text-xs text-[#7D6F74] dark:text-[#B8A8AF] line-clamp-2">
                        {trip.notes}
                      </p>
                    )}

                    {/* Highlights stats */}
                    <div className="grid grid-cols-2 gap-2 py-1">
                      <div className="p-2 rounded-xl bg-[#FAF8F5] dark:bg-[#2D2228] border border-[#F2E8E4] dark:border-[#3D2F36]">
                        <span className="text-[10px] text-[#7D6F74] dark:text-[#B8A8AF] block">
                          Lugares Salvos
                        </span>
                        <span className="font-bold text-[#2D2327] dark:text-[#FAF4F0] text-xs flex items-center gap-1 mt-0.5">
                          <Sparkles className="w-3 h-3 text-[#E07A8B]" />
                          {places.length} locais de sonho
                        </span>
                      </div>
                      <div className="p-2 rounded-xl bg-[#FAF8F5] dark:bg-[#2D2228] border border-[#F2E8E4] dark:border-[#3D2F36]">
                        <span className="text-[10px] text-[#7D6F74] dark:text-[#B8A8AF] block">
                          Roteiro Diário
                        </span>
                        <span className="font-bold text-[#2D2327] dark:text-[#FAF4F0] text-xs flex items-center gap-1 mt-0.5">
                          <Calendar className="w-3 h-3 text-[#D4A373]" />
                          {itinerary.length} dias programados
                        </span>
                      </div>
                    </div>

                    {/* Packing progress */}
                    <div className="flex items-center justify-between text-xs text-[#7D6F74] dark:text-[#B8A8AF] pt-1">
                      <span className="flex items-center gap-1">
                        <Luggage className="w-3.5 h-3.5 text-[#D4A373]" />
                        Mala conjunta ({packedCount}/{totalLuggage} itens)
                      </span>
                      <span className="font-semibold text-[#2D2327] dark:text-[#FAF4F0]">
                        {totalLuggage > 0 ? Math.round((packedCount / totalLuggage) * 100) : 0}%
                      </span>
                    </div>

                    <div className="w-full h-1.5 rounded-full bg-[#FAF3EC] dark:bg-[#33252C] overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-[#E07A8B] to-[#D4A373] transition-all"
                        style={{
                          width: `${totalLuggage > 0 ? (packedCount / totalLuggage) * 100 : 0}%`,
                        }}
                      />
                    </div>
                  </div>

                  {/* Open Trip Details Modal */}
                  <div className="pt-3 border-t border-[#F2E8E4] dark:border-[#3D2F36] flex items-center justify-between">
                    <span className="text-xs text-[#7D6F74] dark:text-[#B8A8AF]">
                      Orçamento:{' '}
                      <strong className="text-[#2D2327] dark:text-[#FAF4F0]">
                        {budget > 0 ? `R$ ${budget.toLocaleString('pt-BR')}` : 'A definir'}
                      </strong>
                    </span>

                    <button
                      onClick={() => {
                        setSelectedTrip(trip);
                        setActiveTab('itinerary');
                      }}
                      className="px-4 py-2 rounded-xl bg-[#E07A8B] hover:bg-[#d66a7b] text-white text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Compass className="w-3.5 h-3.5" />
                      <span>Abrir Roteiro & Mala</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Selected Trip Full Modal (Roteiro, Lugares com Links, Mala, Orçamento) */}
      {selectedTrip && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white dark:bg-[#241C21] rounded-3xl max-w-3xl w-full max-h-[92vh] overflow-y-auto border border-[#F2E8E4] dark:border-[#3D2F36] shadow-2xl p-5 sm:p-6 space-y-5">
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-4 pb-4 border-b border-[#F2E8E4] dark:border-[#3D2F36]">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-100 dark:bg-rose-950 text-[#E07A8B] dark:text-[#F492A5] flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {selectedTrip.destination}
                  </span>
                  <span className="text-xs text-[#7D6F74] dark:text-[#B8A8AF]">
                    {new Date(selectedTrip.startDate + 'T00:00:00').toLocaleDateString('pt-BR')} até{' '}
                    {new Date(selectedTrip.endDate + 'T00:00:00').toLocaleDateString('pt-BR')}
                  </span>
                </div>
                <h3 className="font-serif font-bold text-xl sm:text-2xl text-[#2D2327] dark:text-[#FAF4F0] mt-1">
                  {selectedTrip.title}
                </h3>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => openEditTripModal(selectedTrip)}
                  className="p-2 rounded-xl text-[#7D6F74] hover:text-[#E07A8B] hover:bg-[#FAF3EC] dark:hover:bg-[#2F2228] transition-colors"
                  title="Editar Viagem"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setSelectedTrip(null)}
                  className="p-2 rounded-xl text-[#7D6F74] hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors font-bold text-sm"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* AI Assistant Banner */}
            <div className="p-3.5 rounded-2xl bg-gradient-to-r from-[#FAF3EC] via-[#FFF8F5] to-[#FAF3EC] dark:from-[#2F2228] dark:via-[#261D22] dark:to-[#2F2228] border border-[#F2E8E4] dark:border-[#3D2F36] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#E07A8B] to-[#D4A373] flex items-center justify-center text-white shrink-0 shadow-xs">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h5 className="font-semibold text-xs sm:text-sm text-[#2D2327] dark:text-[#FAF4F0]">
                    Assistente de Viagens Românticas com IA
                  </h5>
                  <p className="text-[11px] text-[#7D6F74] dark:text-[#B8A8AF]">
                    Sugere lugares inesquecíveis com links no Google Maps e um roteiro dia a dia em {selectedTrip.destination}.
                  </p>
                </div>
              </div>

              <button
                type="button"
                disabled={isAiLoading}
                onClick={() => handleAiSuggestItinerary(selectedTrip)}
                className="w-full sm:w-auto px-4 py-2 rounded-xl bg-[#E07A8B] hover:bg-[#d66a7b] text-white text-xs font-semibold flex items-center justify-center gap-2 shrink-0 shadow-xs disabled:opacity-50 transition-colors cursor-pointer"
              >
                {isAiLoading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Consultando IA...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>✨ Sugerir com IA</span>
                  </>
                )}
              </button>
            </div>

            {aiMessage && (
              <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs flex items-center gap-2">
                <Check className="w-4 h-4 shrink-0" />
                <span>{aiMessage}</span>
              </div>
            )}

            {/* Navigation Tabs */}
            <div className="grid grid-cols-2 sm:flex sm:items-center gap-1.5 border-b border-[#F2E8E4] dark:border-[#3D2F36] pb-2">
              <button
                onClick={() => setActiveTab('itinerary')}
                className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap ${
                  activeTab === 'itinerary'
                    ? 'bg-[#FAF3EC] dark:bg-[#2F2228] text-[#E07A8B] dark:text-[#F492A5] shadow-xs'
                    : 'text-[#7D6F74] dark:text-[#B8A8AF] hover:text-[#2D2327]'
                }`}
              >
                <Calendar className="w-4 h-4 shrink-0" />
                <span>Roteiro</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-white dark:bg-[#3D2F36]">
                  {getTripItinerary(selectedTrip).length}
                </span>
              </button>

              <button
                onClick={() => setActiveTab('places')}
                className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap ${
                  activeTab === 'places'
                    ? 'bg-[#FAF3EC] dark:bg-[#2F2228] text-[#E07A8B] dark:text-[#F492A5] shadow-xs'
                    : 'text-[#7D6F74] dark:text-[#B8A8AF] hover:text-[#2D2327]'
                }`}
              >
                <MapPin className="w-4 h-4 shrink-0" />
                <span>Lugares</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-white dark:bg-[#3D2F36]">
                  {getTripWishlistPlaces(selectedTrip).length}
                </span>
              </button>

              <button
                onClick={() => setActiveTab('luggage')}
                className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap ${
                  activeTab === 'luggage'
                    ? 'bg-[#FAF3EC] dark:bg-[#2F2228] text-[#E07A8B] dark:text-[#F492A5] shadow-xs'
                    : 'text-[#7D6F74] dark:text-[#B8A8AF] hover:text-[#2D2327]'
                }`}
              >
                <Luggage className="w-4 h-4 shrink-0" />
                <span>Mala</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-white dark:bg-[#3D2F36]">
                  {selectedTrip.luggageChecklist.filter((l) => l.packed).length}/
                  {selectedTrip.luggageChecklist.length}
                </span>
              </button>

              <button
                onClick={() => setActiveTab('budget')}
                className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap ${
                  activeTab === 'budget'
                    ? 'bg-[#FAF3EC] dark:bg-[#2F2228] text-[#E07A8B] dark:text-[#F492A5] shadow-xs'
                    : 'text-[#7D6F74] dark:text-[#B8A8AF] hover:text-[#2D2327]'
                }`}
              >
                <DollarSign className="w-4 h-4 shrink-0" />
                <span>Orçamento</span>
              </button>
            </div>

            {/* TAB 1: ITINERARY */}
            {activeTab === 'itinerary' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-serif font-bold text-base text-[#2D2327] dark:text-[#FAF4F0]">
                    Cronograma de Dias & Atividades
                  </h4>
                  <button
                    type="button"
                    onClick={() => {
                      const days = getTripItinerary(selectedTrip);
                      const nextDayNum = days.length + 1;
                      const newDay: TravelItineraryDay = {
                        id: `it-${Date.now()}`,
                        day: nextDayNum,
                        date: selectedTrip.startDate,
                        title: `Dia ${nextDayNum} em ${selectedTrip.destination}`,
                        activities: ['Momento especial a dois'],
                      };
                      const updated = {
                        ...selectedTrip,
                        itinerary: [...days, newDay],
                        itineraryDays: [...days, newDay],
                      };
                      onUpdateTrip(updated);
                      setSelectedTrip(updated);
                    }}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-[#E07A8B] hover:underline"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Adicionar Dia</span>
                  </button>
                </div>

                {getTripItinerary(selectedTrip).length === 0 ? (
                  <div className="py-10 text-center rounded-2xl bg-[#FAF8F5] dark:bg-[#2D2228] border border-dashed border-[#F2E8E4] dark:border-[#3D2F36]">
                    <Calendar className="w-8 h-8 text-[#E07A8B]/60 mx-auto mb-2" />
                    <p className="text-xs sm:text-sm font-semibold text-[#2D2327] dark:text-[#FAF4F0]">
                      Nenhum dia cadastrado no roteiro ainda
                    </p>
                    <p className="text-xs text-[#7D6F74] dark:text-[#B8A8AF] mt-1 mb-3">
                      Clique em "Sugerir com IA" acima para criar um roteiro romântico completo automaticamente!
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {getTripItinerary(selectedTrip).map((day) => (
                      <div
                        key={day.id}
                        className="p-4 rounded-2xl bg-[#FAF8F5] dark:bg-[#2D2228] border border-[#F2E8E4] dark:border-[#3D2F36] space-y-3"
                      >
                        <div className="flex items-center justify-between pb-2 border-b border-[#F2E8E4] dark:border-[#3D2F36]">
                          <div className="flex items-center gap-2">
                            <span className="w-7 h-7 rounded-full bg-gradient-to-r from-[#E07A8B] to-[#D4A373] text-white font-bold text-xs flex items-center justify-center shadow-xs">
                              {day.day}
                            </span>
                            <span className="font-serif font-bold text-sm sm:text-base text-[#2D2327] dark:text-[#FAF4F0]">
                              {day.title}
                            </span>
                          </div>

                          <button
                            type="button"
                            onClick={() => {
                              setSelectedDayId(selectedDayId === day.id ? null : day.id);
                              setNewActivityText('');
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white dark:bg-[#3D2F36] text-xs font-semibold text-[#E07A8B] hover:shadow-xs transition-all"
                          >
                            <Plus className="w-3 h-3" />
                            <span>Adicionar Atividade</span>
                          </button>
                        </div>

                        {/* Activities List */}
                        <ul className="space-y-2">
                          {day.activities.map((act, actIdx) => (
                            <li
                              key={actIdx}
                              className="flex items-start gap-2.5 text-xs sm:text-sm text-[#2D2327] dark:text-[#FAF4F0]"
                            >
                              <span className="w-1.5 h-1.5 rounded-full bg-[#E07A8B] shrink-0 mt-2" />
                              <span className="flex-1 leading-relaxed">{act}</span>
                            </li>
                          ))}
                        </ul>

                        {/* Add activity form */}
                        {selectedDayId === day.id && (
                          <div className="flex items-center gap-2 pt-2 border-t border-[#F2E8E4]/60 dark:border-[#3D2F36]/60">
                            <input
                              type="text"
                              value={newActivityText}
                              onChange={(e) => setNewActivityText(e.target.value)}
                              placeholder="Nova atividade (ex: Pôr do sol no mirante abraçadinhos)..."
                              className="flex-1 px-3 py-1.5 rounded-xl bg-white dark:bg-[#241C21] border border-[#F2E8E4] dark:border-[#3D2F36] text-xs text-[#2D2327] dark:text-[#FAF4F0] focus:outline-none focus:ring-1 focus:ring-[#E07A8B]"
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  handleAddActivityToDay(selectedTrip, day.id);
                                }
                              }}
                            />
                            <button
                              type="button"
                              onClick={() => handleAddActivityToDay(selectedTrip, day.id)}
                              className="px-3 py-1.5 rounded-xl bg-[#E07A8B] text-white text-xs font-semibold hover:bg-[#d66a7c]"
                            >
                              Salvar
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: DREAM PLACES WITH GOOGLE MAPS LINKS */}
            {activeTab === 'places' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-serif font-bold text-base text-[#2D2327] dark:text-[#FAF4F0]">
                      Lugares dos Sonhos Para Visitar
                    </h4>
                    <p className="text-xs text-[#7D6F74] dark:text-[#B8A8AF]">
                      Pontos turísticos, restaurantes e cantinhos românticos com link direto no Google Maps.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsAddingPlace(!isAddingPlace)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#FAF3EC] dark:bg-[#2F2228] text-xs font-semibold text-[#E07A8B] dark:text-[#F492A5] hover:bg-[#F2E8E4] transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Novo Lugar</span>
                  </button>
                </div>

                {/* Add place form */}
                {isAddingPlace && (
                  <div className="p-4 rounded-2xl bg-[#FAF8F5] dark:bg-[#2D2228] border border-[#F2E8E4] dark:border-[#3D2F36] space-y-3">
                    <h5 className="font-serif font-bold text-sm text-[#2D2327] dark:text-[#FAF4F0]">
                      Adicionar Lugar dos Sonhos
                    </h5>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-[#2D2327] dark:text-[#FAF4F0] mb-1">
                          Nome do Local *
                        </label>
                        <input
                          type="text"
                          required
                          value={newPlaceName}
                          onChange={(e) => setNewPlaceName(e.target.value)}
                          placeholder="Ex: Mirante da Pedra, Café das Flores"
                          className="w-full px-3 py-1.5 rounded-xl bg-white dark:bg-[#241C21] border border-[#F2E8E4] dark:border-[#3D2F36] text-xs text-[#2D2327] dark:text-[#FAF4F0] focus:outline-none focus:ring-1 focus:ring-[#E07A8B]"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-[#2D2327] dark:text-[#FAF4F0] mb-1">
                          Categoria
                        </label>
                        <select
                          value={newPlaceCategory}
                          onChange={(e) => setNewPlaceCategory(e.target.value)}
                          className="w-full px-3 py-1.5 rounded-xl bg-white dark:bg-[#241C21] border border-[#F2E8E4] dark:border-[#3D2F36] text-xs text-[#2D2327] dark:text-[#FAF4F0] focus:outline-none focus:ring-1 focus:ring-[#E07A8B]"
                        >
                          <option value="Passeio Romântico">Passeio Romântico</option>
                          <option value="Gastronomia Romântica">Gastronomia Romântica</option>
                          <option value="Ponto Turístico">Ponto Turístico</option>
                          <option value="Natureza & Fotos">Natureza & Fotos</option>
                          <option value="Café & Doces">Café & Doces</option>
                          <option value="Pôr do Sol">Pôr do Sol</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-[#2D2327] dark:text-[#FAF4F0] mb-1">
                        Por que queremos conhecer? (Dica / Anotação)
                      </label>
                      <input
                        type="text"
                        value={newPlaceNotes}
                        onChange={(e) => setNewPlaceNotes(e.target.value)}
                        placeholder="Ex: Recomendaram ir no fim da tarde para ver o pôr do sol..."
                        className="w-full px-3 py-1.5 rounded-xl bg-white dark:bg-[#241C21] border border-[#F2E8E4] dark:border-[#3D2F36] text-xs text-[#2D2327] dark:text-[#FAF4F0] focus:outline-none focus:ring-1 focus:ring-[#E07A8B]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-[#2D2327] dark:text-[#FAF4F0] mb-1">
                        Link do Google Maps ou Site (Opcional - criamos automaticamente se deixar vazio!)
                      </label>
                      <input
                        type="url"
                        value={newPlaceLink}
                        onChange={(e) => setNewPlaceLink(e.target.value)}
                        placeholder="https://maps.google.com/..."
                        className="w-full px-3 py-1.5 rounded-xl bg-white dark:bg-[#241C21] border border-[#F2E8E4] dark:border-[#3D2F36] text-xs text-[#2D2327] dark:text-[#FAF4F0] focus:outline-none focus:ring-1 focus:ring-[#E07A8B]"
                      />
                    </div>

                    <div className="flex justify-end gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setIsAddingPlace(false)}
                        className="px-3 py-1.5 rounded-xl text-xs text-[#7D6F74] hover:bg-zinc-100 dark:hover:bg-zinc-800"
                      >
                        Cancelar
                      </button>
                      <button
                        type="button"
                        onClick={() => handleAddPlace(selectedTrip)}
                        className="px-4 py-1.5 rounded-xl bg-[#E07A8B] text-white text-xs font-semibold hover:bg-[#d66a7c]"
                      >
                        Salvar Lugar
                      </button>
                    </div>
                  </div>
                )}

                {/* Places Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {getTripWishlistPlaces(selectedTrip).map((place) => {
                    const mapsUrl =
                      place.link ||
                      `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place.name + ' ' + selectedTrip.destination)}`;

                    return (
                      <div
                        key={place.id}
                        className={`p-4 rounded-2xl border transition-all flex flex-col justify-between space-y-2.5 ${
                          place.visited
                            ? 'bg-[#FAF8F5]/60 dark:bg-[#20181D]/60 border-[#F2E8E4]/50 opacity-75'
                            : 'bg-white dark:bg-[#2A2026] border-[#F2E8E4] dark:border-[#3D2F36] shadow-xs'
                        }`}
                      >
                        <div>
                          <div className="flex items-start justify-between gap-2">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#FAF3EC] dark:bg-[#33252C] text-[#E07A8B] dark:text-[#F492A5]">
                              {place.category || 'Passeio a Dois'}
                            </span>

                            <button
                              type="button"
                              onClick={() => handleDeletePlace(selectedTrip, place.id)}
                              className="text-[#7D6F74] hover:text-rose-500 p-1"
                              title="Remover lugar"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          <h5
                            className={`font-serif font-bold text-sm mt-1.5 ${
                              place.visited
                                ? 'line-through text-[#7D6F74] dark:text-[#B8A8AF]'
                                : 'text-[#2D2327] dark:text-[#FAF4F0]'
                            }`}
                          >
                            {place.name}
                          </h5>

                          {place.notes && (
                            <p className="text-xs text-[#7D6F74] dark:text-[#B8A8AF] mt-1 leading-relaxed">
                              {place.notes}
                            </p>
                          )}
                        </div>

                        <div className="pt-2 border-t border-[#F2E8E4]/70 dark:border-[#3D2F36]/70 flex items-center justify-between">
                          <label className="flex items-center gap-1.5 text-xs text-[#7D6F74] dark:text-[#B8A8AF] cursor-pointer">
                            <input
                              type="checkbox"
                              checked={place.visited}
                              onChange={() => handleTogglePlaceVisited(selectedTrip, place.id)}
                              className="rounded accent-[#E07A8B]"
                            />
                            <span>{place.visited ? 'Já fomos! ✨' : 'Quero ir'}</span>
                          </label>

                          <a
                            href={mapsUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs font-semibold text-[#E07A8B] dark:text-[#F492A5] hover:underline"
                            title="Abrir localização no Google Maps"
                          >
                            <span>Ver no Maps</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* TAB 3: LUGGAGE CHECKLIST */}
            {activeTab === 'luggage' && (
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <h4 className="font-serif font-bold text-base text-[#2D2327] dark:text-[#FAF4F0]">
                    Checklist da Nossa Mala
                  </h4>

                  {/* Filter by assignee */}
                  <div className="flex items-center gap-1 bg-[#FAF8F5] dark:bg-[#2D2228] p-1 rounded-xl border border-[#F2E8E4] dark:border-[#3D2F36]">
                    <button
                      onClick={() => setLuggageFilter('all')}
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                        luggageFilter === 'all'
                          ? 'bg-white dark:bg-[#3D2F36] text-[#E07A8B] shadow-xs font-bold'
                          : 'text-[#7D6F74] dark:text-[#B8A8AF]'
                      }`}
                    >
                      Todos
                    </button>
                    <button
                      onClick={() => setLuggageFilter('partner1')}
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                        luggageFilter === 'partner1'
                          ? 'bg-white dark:bg-[#3D2F36] text-[#E07A8B] shadow-xs font-bold'
                          : 'text-[#7D6F74] dark:text-[#B8A8AF]'
                      }`}
                    >
                      {profile.partner1.name}
                    </button>
                    <button
                      onClick={() => setLuggageFilter('partner2')}
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                        luggageFilter === 'partner2'
                          ? 'bg-white dark:bg-[#3D2F36] text-[#E07A8B] shadow-xs font-bold'
                          : 'text-[#7D6F74] dark:text-[#B8A8AF]'
                      }`}
                    >
                      {profile.partner2.name}
                    </button>
                    <button
                      onClick={() => setLuggageFilter('ambos')}
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                        luggageFilter === 'ambos'
                          ? 'bg-white dark:bg-[#3D2F36] text-[#E07A8B] shadow-xs font-bold'
                          : 'text-[#7D6F74] dark:text-[#B8A8AF]'
                      }`}
                    >
                      Ambos
                    </button>
                  </div>
                </div>

                {/* Add luggage item form */}
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={newLuggageItem}
                    onChange={(e) => setNewLuggageItem(e.target.value)}
                    placeholder="Novo item na mala (ex: Casaco corta-vento, Carregador por indução)..."
                    className="flex-1 px-3 py-2 rounded-xl bg-[#FAF8F5] dark:bg-[#2D2228] border border-[#F2E8E4] dark:border-[#3D2F36] text-xs text-[#2D2327] dark:text-[#FAF4F0] focus:outline-none focus:ring-1 focus:ring-[#E07A8B]"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddLuggageItem(selectedTrip);
                      }
                    }}
                  />
                  <select
                    value={newLuggageAssignee}
                    onChange={(e) => setNewLuggageAssignee(e.target.value as any)}
                    className="px-2.5 py-2 rounded-xl bg-[#FAF8F5] dark:bg-[#2D2228] border border-[#F2E8E4] dark:border-[#3D2F36] text-xs text-[#7D6F74] dark:text-[#B8A8AF]"
                  >
                    <option value="ambos">Ambos</option>
                    <option value="partner1">{profile.partner1.name}</option>
                    <option value="partner2">{profile.partner2.name}</option>
                  </select>
                  <button
                    type="button"
                    onClick={() => handleAddLuggageItem(selectedTrip)}
                    className="px-4 py-2 rounded-xl bg-[#E07A8B] text-white text-xs font-semibold hover:bg-[#d66a7c] shadow-xs"
                  >
                    Adicionar
                  </button>
                </div>

                {/* Luggage Items Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {selectedTrip.luggageChecklist
                    .filter((l) => luggageFilter === 'all' || l.assignedTo === luggageFilter)
                    .map((l) => (
                      <div
                        key={l.id}
                        className={`flex items-center justify-between p-2.5 rounded-xl border transition-all ${
                          l.packed
                            ? 'bg-[#FAF8F5]/60 dark:bg-[#20181D]/60 border-[#F2E8E4]/50 opacity-60'
                            : 'bg-white dark:bg-[#2A2026] border-[#F2E8E4] dark:border-[#3D2F36]'
                        }`}
                      >
                        <div
                          onClick={() => handleToggleLuggage(selectedTrip, l.id)}
                          className="flex items-center gap-2.5 flex-1 cursor-pointer"
                        >
                          {l.packed ? (
                            <CheckCircle2 className="w-4 h-4 fill-[#E07A8B] text-white shrink-0" />
                          ) : (
                            <Circle className="w-4 h-4 text-zinc-300 dark:text-zinc-600 shrink-0" />
                          )}
                          <span
                            className={`text-xs ${
                              l.packed
                                ? 'line-through text-[#7D6F74] dark:text-[#B8A8AF]'
                                : 'text-[#2D2327] dark:text-[#FAF4F0]'
                            }`}
                          >
                            {l.item}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="text-[10px] px-2 py-0.5 rounded-md bg-[#FAF3EC] dark:bg-[#33252C] text-[#D4A373] dark:text-[#EAD5C3]">
                            {l.assignedTo === 'ambos'
                              ? 'Ambos'
                              : l.assignedTo === 'partner1'
                              ? profile.partner1.name
                              : profile.partner2.name}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleDeleteLuggageItem(selectedTrip, l.id)}
                            className="text-[#7D6F74] hover:text-rose-500 p-0.5"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* TAB 4: BUDGET & EXPENSES */}
            {activeTab === 'budget' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-4 rounded-2xl bg-[#FAF8F5] dark:bg-[#2D2228] border border-[#F2E8E4] dark:border-[#3D2F36]">
                    <span className="text-xs text-[#7D6F74] dark:text-[#B8A8AF]">Orçamento Estimado</span>
                    <h4 className="font-serif font-bold text-xl text-[#2D2327] dark:text-[#FAF4F0] mt-1">
                      R$ {getTripBudget(selectedTrip).toLocaleString('pt-BR')}
                    </h4>
                  </div>

                  <div className="p-4 rounded-2xl bg-[#FAF8F5] dark:bg-[#2D2228] border border-[#F2E8E4] dark:border-[#3D2F36]">
                    <span className="text-xs text-[#7D6F74] dark:text-[#B8A8AF]">Já Gasto / Reservado</span>
                    <h4 className="font-serif font-bold text-xl text-rose-500 mt-1">
                      R$ {getTripSpent(selectedTrip).toLocaleString('pt-BR')}
                    </h4>
                  </div>

                  <div className="p-4 rounded-2xl bg-[#FAF8F5] dark:bg-[#2D2228] border border-[#F2E8E4] dark:border-[#3D2F36]">
                    <span className="text-xs text-[#7D6F74] dark:text-[#B8A8AF]">Saldo Restante</span>
                    <h4 className="font-serif font-bold text-xl text-emerald-600 dark:text-emerald-400 mt-1">
                      R${' '}
                      {Math.max(0, getTripBudget(selectedTrip) - getTripSpent(selectedTrip)).toLocaleString(
                        'pt-BR'
                      )}
                    </h4>
                  </div>
                </div>

                {/* Progress bar */}
                <div>
                  <div className="flex items-center justify-between text-xs text-[#7D6F74] dark:text-[#B8A8AF] mb-1.5">
                    <span>Comprometimento do orçamento</span>
                    <span>
                      {getTripBudget(selectedTrip) > 0
                        ? Math.round((getTripSpent(selectedTrip) / getTripBudget(selectedTrip)) * 100)
                        : 0}
                      %
                    </span>
                  </div>
                  <div className="w-full h-2.5 rounded-full bg-[#FAF3EC] dark:bg-[#33252C] overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-emerald-500 via-amber-500 to-rose-500 transition-all"
                      style={{
                        width: `${Math.min(
                          100,
                          getTripBudget(selectedTrip) > 0
                            ? (getTripSpent(selectedTrip) / getTripBudget(selectedTrip)) * 100
                            : 0
                        )}%`,
                      }}
                    />
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-xs text-amber-900 dark:text-amber-200 flex items-center justify-between">
                  <div>
                    <span className="font-semibold block">Deseja atualizar os valores gastos?</span>
                    <span>Clique em editar para ajustar o orçamento ou gastos desta viagem.</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => openEditTripModal(selectedTrip)}
                    className="px-3 py-1.5 rounded-xl bg-amber-600 text-white font-semibold hover:bg-amber-700 transition-colors"
                  >
                    Ajustar Gastos
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Add Trip Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#241C21] rounded-3xl max-w-md w-full p-6 border border-[#F2E8E4] dark:border-[#3D2F36] shadow-xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-2 border-b border-[#F2E8E4] dark:border-[#3D2F36]">
              <h3 className="font-serif font-bold text-lg text-[#2D2327] dark:text-[#FAF4F0]">
                Planejar Nova Viagem
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-xs text-[#7D6F74] hover:text-[#2D2327] dark:hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateTrip} className="space-y-3 text-xs sm:text-sm">
              <div>
                <label className="block font-medium text-[#2D2327] dark:text-[#FAF4F0] mb-1">
                  Título da Viagem *
                </label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Ex: Fim de Semana Romântico em Gramado"
                  className="w-full px-3 py-2 rounded-xl bg-[#FAF8F5] dark:bg-[#2D2228] border border-[#F2E8E4] dark:border-[#3D2F36] text-[#2D2327] dark:text-[#FAF4F0] focus:outline-none focus:ring-1 focus:ring-[#E07A8B]"
                />
              </div>

              <div>
                <label className="block font-medium text-[#2D2327] dark:text-[#FAF4F0] mb-1">
                  Destino (Cidade, Estado/País) *
                </label>
                <input
                  type="text"
                  required
                  value={newDestination}
                  onChange={(e) => setNewDestination(e.target.value)}
                  placeholder="Ex: Gramado, RS"
                  className="w-full px-3 py-2 rounded-xl bg-[#FAF8F5] dark:bg-[#2D2228] border border-[#F2E8E4] dark:border-[#3D2F36] text-[#2D2327] dark:text-[#FAF4F0] focus:outline-none focus:ring-1 focus:ring-[#E07A8B]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-[#2D2327] dark:text-[#FAF4F0] mb-1">
                    Data de Ida *
                  </label>
                  <input
                    type="date"
                    required
                    value={newStartDate}
                    onChange={(e) => setNewStartDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#FAF8F5] dark:bg-[#2D2228] border border-[#F2E8E4] dark:border-[#3D2F36] text-[#2D2327] dark:text-[#FAF4F0] focus:outline-none focus:ring-1 focus:ring-[#E07A8B]"
                  />
                </div>
                <div>
                  <label className="block font-medium text-[#2D2327] dark:text-[#FAF4F0] mb-1">
                    Data de Volta
                  </label>
                  <input
                    type="date"
                    value={newEndDate}
                    onChange={(e) => setNewEndDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#FAF8F5] dark:bg-[#2D2228] border border-[#F2E8E4] dark:border-[#3D2F36] text-[#2D2327] dark:text-[#FAF4F0] focus:outline-none focus:ring-1 focus:ring-[#E07A8B]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-[#2D2327] dark:text-[#FAF4F0] mb-1">
                  Orçamento Estimado (R$)
                </label>
                <input
                  type="number"
                  value={newBudget}
                  onChange={(e) => setNewBudget(e.target.value)}
                  placeholder="Ex: 3500"
                  className="w-full px-3 py-2 rounded-xl bg-[#FAF8F5] dark:bg-[#2D2228] border border-[#F2E8E4] dark:border-[#3D2F36] text-[#2D2327] dark:text-[#FAF4F0] focus:outline-none focus:ring-1 focus:ring-[#E07A8B]"
                />
              </div>

              <div>
                <label className="block font-medium text-[#2D2327] dark:text-[#FAF4F0] mb-1">
                  Foto de Capa (URL)
                </label>
                <input
                  type="url"
                  value={newCoverUrl}
                  onChange={(e) => setNewCoverUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full px-3 py-2 rounded-xl bg-[#FAF8F5] dark:bg-[#2D2228] border border-[#F2E8E4] dark:border-[#3D2F36] text-[#2D2327] dark:text-[#FAF4F0] focus:outline-none focus:ring-1 focus:ring-[#E07A8B]"
                />
              </div>

              <div>
                <label className="block font-medium text-[#2D2327] dark:text-[#FAF4F0] mb-1">
                  Anotações / Ideias da Viagem
                </label>
                <textarea
                  rows={2}
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  placeholder="Ex: Queremos jantar com vista e alugar uma cabana com banheira..."
                  className="w-full px-3 py-2 rounded-xl bg-[#FAF8F5] dark:bg-[#2D2228] border border-[#F2E8E4] dark:border-[#3D2F36] text-[#2D2327] dark:text-[#FAF4F0] focus:outline-none focus:ring-1 focus:ring-[#E07A8B]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-[#7D6F74] hover:bg-zinc-100 dark:hover:bg-zinc-800"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#E07A8B] hover:bg-[#d66a7c] text-white font-medium shadow-xs"
                >
                  Salvar Viagem
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Trip Modal */}
      {editingTrip && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#241C21] rounded-3xl max-w-md w-full p-6 border border-[#F2E8E4] dark:border-[#3D2F36] shadow-xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-2 border-b border-[#F2E8E4] dark:border-[#3D2F36]">
              <div className="flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-[#E07A8B]" />
                <h3 className="font-serif font-bold text-lg text-[#2D2327] dark:text-[#FAF4F0]">
                  Editar Viagem
                </h3>
              </div>
              <button
                onClick={() => setEditingTrip(null)}
                className="text-xs text-[#7D6F74] hover:text-[#2D2327] dark:hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveTripEdit} className="space-y-3 text-xs sm:text-sm">
              <div>
                <label className="block font-medium text-[#2D2327] dark:text-[#FAF4F0] mb-1">
                  Título da Viagem *
                </label>
                <input
                  type="text"
                  required
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#FAF8F5] dark:bg-[#2D2228] border border-[#F2E8E4] dark:border-[#3D2F36] text-[#2D2327] dark:text-[#FAF4F0] focus:outline-none focus:ring-1 focus:ring-[#E07A8B]"
                />
              </div>

              <div>
                <label className="block font-medium text-[#2D2327] dark:text-[#FAF4F0] mb-1">
                  Destino *
                </label>
                <input
                  type="text"
                  required
                  value={editDestination}
                  onChange={(e) => setEditDestination(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#FAF8F5] dark:bg-[#2D2228] border border-[#F2E8E4] dark:border-[#3D2F36] text-[#2D2327] dark:text-[#FAF4F0] focus:outline-none focus:ring-1 focus:ring-[#E07A8B]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-[#2D2327] dark:text-[#FAF4F0] mb-1">
                    Status
                  </label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl bg-[#FAF8F5] dark:bg-[#2D2228] border border-[#F2E8E4] dark:border-[#3D2F36] text-[#2D2327] dark:text-[#FAF4F0] focus:outline-none focus:ring-1 focus:ring-[#E07A8B]"
                  >
                    <option value="planejando">Planejando</option>
                    <option value="confirmada">Confirmada</option>
                    <option value="realizada">Realizada</option>
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-[#2D2327] dark:text-[#FAF4F0] mb-1">
                    Data de Ida
                  </label>
                  <input
                    type="date"
                    required
                    value={editStartDate}
                    onChange={(e) => setEditStartDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#FAF8F5] dark:bg-[#2D2228] border border-[#F2E8E4] dark:border-[#3D2F36] text-[#2D2327] dark:text-[#FAF4F0] focus:outline-none focus:ring-1 focus:ring-[#E07A8B]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-[#2D2327] dark:text-[#FAF4F0] mb-1">
                    Data de Volta
                  </label>
                  <input
                    type="date"
                    value={editEndDate}
                    onChange={(e) => setEditEndDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#FAF8F5] dark:bg-[#2D2228] border border-[#F2E8E4] dark:border-[#3D2F36] text-[#2D2327] dark:text-[#FAF4F0] focus:outline-none focus:ring-1 focus:ring-[#E07A8B]"
                  />
                </div>

                <div>
                  <label className="block font-medium text-[#2D2327] dark:text-[#FAF4F0] mb-1">
                    Orçamento Estimado (R$)
                  </label>
                  <input
                    type="number"
                    value={editBudget}
                    onChange={(e) => setEditBudget(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#FAF8F5] dark:bg-[#2D2228] border border-[#F2E8E4] dark:border-[#3D2F36] text-[#2D2327] dark:text-[#FAF4F0] focus:outline-none focus:ring-1 focus:ring-[#E07A8B]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-[#2D2327] dark:text-[#FAF4F0] mb-1">
                  Total Já Gasto (R$)
                </label>
                <input
                  type="number"
                  value={editSpent}
                  onChange={(e) => setEditSpent(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#FAF8F5] dark:bg-[#2D2228] border border-[#F2E8E4] dark:border-[#3D2F36] text-[#2D2327] dark:text-[#FAF4F0] focus:outline-none focus:ring-1 focus:ring-[#E07A8B]"
                />
              </div>

              <div>
                <label className="block font-medium text-[#2D2327] dark:text-[#FAF4F0] mb-1">
                  Foto de Capa (URL)
                </label>
                <input
                  type="url"
                  value={editCoverUrl}
                  onChange={(e) => setEditCoverUrl(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#FAF8F5] dark:bg-[#2D2228] border border-[#F2E8E4] dark:border-[#3D2F36] text-[#2D2327] dark:text-[#FAF4F0] focus:outline-none focus:ring-1 focus:ring-[#E07A8B]"
                />
              </div>

              <div>
                <label className="block font-medium text-[#2D2327] dark:text-[#FAF4F0] mb-1">
                  Anotações da Viagem
                </label>
                <textarea
                  rows={2}
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#FAF8F5] dark:bg-[#2D2228] border border-[#F2E8E4] dark:border-[#3D2F36] text-[#2D2327] dark:text-[#FAF4F0] focus:outline-none focus:ring-1 focus:ring-[#E07A8B]"
                />
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-[#F2E8E4] dark:border-[#3D2F36]">
                <button
                  type="button"
                  onClick={() => {
                    const toDel = editingTrip;
                    setEditingTrip(null);
                    setTripToDelete(toDel);
                  }}
                  className="inline-flex items-center gap-1 text-xs text-rose-500 hover:underline"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Excluir Viagem</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingTrip(null)}
                    className="px-4 py-2 rounded-xl text-[#7D6F74] hover:bg-zinc-100 dark:hover:bg-zinc-800"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-[#E07A8B] hover:bg-[#d66a7c] text-white font-medium shadow-xs"
                  >
                    Salvar Alterações
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {tripToDelete && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#241C21] rounded-3xl max-w-sm w-full p-6 border border-[#F2E8E4] dark:border-[#3D2F36] shadow-xl text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-500 mx-auto flex items-center justify-center">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-serif font-bold text-lg text-[#2D2327] dark:text-[#FAF4F0]">
                Excluir Viagem?
              </h3>
              <p className="text-xs text-[#7D6F74] dark:text-[#B8A8AF] mt-1">
                Deseja remover o plano de viagem para "<strong>{tripToDelete.destination}</strong>"?
              </p>
            </div>
            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                onClick={() => setTripToDelete(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-[#7D6F74] hover:bg-zinc-100 dark:hover:bg-zinc-800"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  onDeleteTrip(tripToDelete.id);
                  if (selectedTrip?.id === tripToDelete.id) {
                    setSelectedTrip(null);
                  }
                  setTripToDelete(null);
                }}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-rose-500 hover:bg-rose-600 text-white shadow-xs"
              >
                Sim, Excluir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
