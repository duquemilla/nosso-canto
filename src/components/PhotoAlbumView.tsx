import React, { useState } from 'react';
import {
  Camera,
  Heart,
  MapPin,
  Calendar,
  Plus,
  Trash2,
  Sparkles,
  Upload,
} from 'lucide-react';
import { PhotoMemory, PartnerId, CoupleProfile } from '../types';
import { compressImageFile } from '../utils/imageCompression';
import { PartnerAvatar } from './PartnerAvatar';

interface PhotoAlbumViewProps {
  photos: PhotoMemory[];
  profile: CoupleProfile;
  activePartner: PartnerId;
  onAddPhoto: (photo: Omit<PhotoMemory, 'id'>) => void;
  onLikePhoto: (id: string, partner: PartnerId) => void;
  onDeletePhoto: (id: string) => void;
}

export const PhotoAlbumView: React.FC<PhotoAlbumViewProps> = ({
  photos,
  profile,
  activePartner,
  onAddPhoto,
  onLikePhoto,
  onDeletePhoto,
}) => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [previewImage, setPreviewImage] = useState<PhotoMemory | null>(null);
  const [viewMode, setViewMode] = useState<'compact' | 'polaroid'>('compact');

  // New photo form
  const [newTitle, setNewTitle] = useState('');
  const [newCaption, setNewCaption] = useState('');
  const [newLocation, setNewLocation] = useState('');
  const [newDate, setNewDate] = useState(new Date().toISOString().split('T')[0]);
  const [imageUrl, setImageUrl] = useState('');

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const compressed = await compressImageFile(file, 1200, 0.75);
        setImageUrl(compressed);
      } catch (err) {
        console.error('Falha ao comprimir imagem:', err);
      }
    }
  };

  const handleCreatePhoto = (e: React.FormEvent) => {
    e.preventDefault();
    if (!imageUrl) return;

    onAddPhoto({
      url: imageUrl,
      caption: newCaption.trim() || newTitle.trim(),
      date: newDate,
      location: newLocation.trim() || undefined,
      uploadedBy: activePartner,
      likes: [activePartner],
    });

    setNewTitle('');
    setNewCaption('');
    setNewLocation('');
    setImageUrl('');
    setIsAddModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-serif text-2xl font-bold text-[#2D2327] dark:text-[#FAF4F0]">
            Nosso Álbum de Memórias
          </h2>
          <p className="text-xs sm:text-sm text-[#7D6F74] dark:text-[#B8A8AF] mt-0.5">
            Cada foto guarda um sorriso, uma viagem ou um momento especial que vivemos juntos.
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
          {/* View mode toggle (Compact / Expanded) */}
          <div className="flex items-center p-1 rounded-2xl bg-[#FAF3EC] dark:bg-[#271E23] border border-[#F2E8E4] dark:border-[#3D2F36] text-xs">
            <button
              type="button"
              onClick={() => setViewMode('compact')}
              className={`px-2.5 py-1.5 rounded-xl font-medium transition-all ${
                viewMode === 'compact'
                  ? 'bg-white dark:bg-[#3D2F36] text-[#E07A8B] shadow-xs'
                  : 'text-[#7D6F74] dark:text-[#B8A8AF]'
              }`}
            >
              📱 Compacto (Celular)
            </button>
            <button
              type="button"
              onClick={() => setViewMode('polaroid')}
              className={`px-2.5 py-1.5 rounded-xl font-medium transition-all ${
                viewMode === 'polaroid'
                  ? 'bg-white dark:bg-[#3D2F36] text-[#E07A8B] shadow-xs'
                  : 'text-[#7D6F74] dark:text-[#B8A8AF]'
              }`}
            >
              🖼️ Detalhado
            </button>
          </div>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-gradient-to-r from-[#E07A8B] to-[#E58C9B] hover:opacity-95 text-white font-medium text-xs sm:text-sm shadow-sm transition-all whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            <span>Adicionar Foto</span>
          </button>
        </div>
      </div>

      {/* Gallery Grid */}
      {photos.length === 0 ? (
        <div className="py-16 text-center rounded-3xl bg-white dark:bg-[#241C21] border border-[#F2E8E4] dark:border-[#3D2F36]">
          <Camera className="w-10 h-10 mx-auto text-[#E07A8B]/60 mb-2" />
          <p className="text-sm font-semibold text-[#2D2327] dark:text-[#FAF4F0]">
            Nenhuma foto salva ainda
          </p>
          <p className="text-xs text-[#7D6F74] dark:text-[#B8A8AF] mt-1">
            Subam fotos daquela viagem inesquecível ou do último date!
          </p>
        </div>
      ) : viewMode === 'compact' ? (
        /* Compact Grid - Perfect for Mobile */
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 sm:gap-4">
          {photos.map((photo) => {
            const hasPartner1Liked = photo.likes.includes('partner1');
            const hasPartner2Liked = photo.likes.includes('partner2');
            const totalLikes = photo.likes.length;

            return (
              <div
                key={photo.id}
                className="group relative flex flex-col rounded-2xl bg-white dark:bg-[#241C21] border border-[#F2E8E4] dark:border-[#3D2F36] overflow-hidden shadow-2xs hover:shadow-md transition-all"
              >
                {/* Photo Thumbnail */}
                <div
                  onClick={() => setPreviewImage(photo)}
                  className="relative aspect-square w-full overflow-hidden bg-zinc-100 dark:bg-zinc-800 cursor-pointer"
                >
                  <img
                    src={photo.url}
                    alt={photo.caption}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60 group-hover:opacity-80 transition-opacity" />

                  {/* Likes Pill Badge */}
                  <div className="absolute top-2 left-2 flex items-center gap-1 bg-black/40 backdrop-blur-xs px-2 py-0.5 rounded-full text-[10px] text-white">
                    <Heart className={`w-2.5 h-2.5 ${totalLikes > 0 ? 'fill-rose-400 text-rose-400' : 'text-white'}`} />
                    <span>{totalLikes}</span>
                  </div>

                  {/* Delete button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeletePhoto(photo.id);
                    }}
                    className="absolute top-2 right-2 p-1 rounded-full bg-black/40 text-white/80 hover:text-rose-400 transition-colors"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>

                  {/* Bottom overlay text */}
                  <div className="absolute bottom-1.5 left-2 right-2">
                    <p className="font-serif text-xs font-medium text-white truncate drop-shadow-xs">
                      {photo.caption}
                    </p>
                  </div>
                </div>

                {/* Compact Info Footer */}
                <div className="p-2 flex items-center justify-between text-[10px] text-[#7D6F74] dark:text-[#B8A8AF] bg-white dark:bg-[#241C21]">
                  <span>{new Date(photo.date + 'T00:00:00').toLocaleDateString('pt-BR')}</span>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => onLikePhoto(photo.id, 'partner1')}
                      className={`p-1 rounded-full flex items-center justify-center ${hasPartner1Liked ? 'ring-2 ring-rose-500' : 'opacity-70 hover:opacity-100'}`}
                      title={profile.partner1.name}
                    >
                      <PartnerAvatar avatar={profile.partner1.avatar} name={profile.partner1.name} size="xs" />
                    </button>
                    <button
                      onClick={() => onLikePhoto(photo.id, 'partner2')}
                      className={`p-1 rounded-full flex items-center justify-center ${hasPartner2Liked ? 'ring-2 ring-rose-500' : 'opacity-70 hover:opacity-100'}`}
                      title={profile.partner2.name}
                    >
                      <PartnerAvatar avatar={profile.partner2.avatar} name={profile.partner2.name} size="xs" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Detailed Polaroid Grid */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {photos.map((photo) => {
            const hasPartner1Liked = photo.likes.includes('partner1');
            const hasPartner2Liked = photo.likes.includes('partner2');
            const uploader =
              photo.uploadedBy === 'partner1' ? profile.partner1 : profile.partner2;

            return (
              <div
                key={photo.id}
                className="group flex flex-col rounded-3xl bg-white dark:bg-[#241C21] border border-[#F2E8E4] dark:border-[#3D2F36] overflow-hidden shadow-xs hover:shadow-md transition-all"
              >
                {/* Photo container */}
                <div
                  onClick={() => setPreviewImage(photo)}
                  className="relative aspect-square w-full overflow-hidden bg-zinc-100 dark:bg-zinc-800 cursor-pointer"
                >
                  <img
                    src={photo.url}
                    alt={photo.caption}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                  {/* Delete button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeletePhoto(photo.id);
                    }}
                    className="absolute top-3 right-3 p-1.5 rounded-full bg-black/50 text-white/80 hover:text-rose-400 hover:bg-black/80 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Caption & Likes Body */}
                <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                  <div>
                    <p className="font-serif text-sm font-medium text-[#2D2327] dark:text-[#FAF4F0] leading-snug">
                      "{photo.caption}"
                    </p>

                    <div className="flex items-center gap-3 text-[11px] text-[#7D6F74] dark:text-[#B8A8AF] mt-1.5 flex-wrap">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-[#E07A8B]" />
                        {new Date(photo.date + 'T00:00:00').toLocaleDateString('pt-BR')}
                      </span>
                      {photo.location && (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-rose-400" />
                          {photo.location}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Bottom Likes & Uploader */}
                  <div className="pt-2 border-t border-[#F2E8E4] dark:border-[#3D2F36] flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {/* Partner 1 like */}
                      <button
                        onClick={() => onLikePhoto(photo.id, 'partner1')}
                        className={`flex items-center gap-1.5 text-xs px-2 py-0.5 rounded-full transition-all ${
                          hasPartner1Liked
                            ? 'text-rose-600 bg-rose-50 dark:bg-rose-950 font-semibold'
                            : 'text-[#7D6F74] dark:text-[#B8A8AF] hover:bg-rose-50'
                        }`}
                        title={`Curtido por ${profile.partner1.name}`}
                      >
                        <PartnerAvatar avatar={profile.partner1.avatar} name={profile.partner1.name} size="xs" />
                        <Heart
                          className={`w-3 h-3 ${
                            hasPartner1Liked ? 'fill-rose-500 text-rose-500' : 'text-zinc-400'
                          }`}
                        />
                      </button>

                      {/* Partner 2 like */}
                      <button
                        onClick={() => onLikePhoto(photo.id, 'partner2')}
                        className={`flex items-center gap-1.5 text-xs px-2 py-0.5 rounded-full transition-all ${
                          hasPartner2Liked
                            ? 'text-rose-600 bg-rose-50 dark:bg-rose-950 font-semibold'
                            : 'text-[#7D6F74] dark:text-[#B8A8AF] hover:bg-rose-50'
                        }`}
                        title={`Curtido por ${profile.partner2.name}`}
                      >
                        <PartnerAvatar avatar={profile.partner2.avatar} name={profile.partner2.name} size="xs" />
                        <Heart
                          className={`w-3 h-3 ${
                            hasPartner2Liked ? 'fill-rose-500 text-rose-500' : 'text-zinc-400'
                          }`}
                        />
                      </button>
                    </div>

                    <span className="text-[10px] text-[#A6999F] dark:text-[#8C7C83]">
                      Por {uploader.name}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Preview Fullscreen Modal */}
      {previewImage && (
        <div
          onClick={() => setPreviewImage(null)}
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="max-w-3xl max-h-[90vh] flex flex-col items-center bg-white dark:bg-[#241C21] rounded-3xl overflow-hidden p-4 shadow-2xl space-y-3 cursor-default"
          >
            <img
              src={previewImage.url}
              alt={previewImage.caption}
              referrerPolicy="no-referrer"
              className="max-h-[70vh] w-auto object-contain rounded-2xl"
            />
            <p className="font-serif text-base font-semibold text-center text-[#2D2327] dark:text-[#FAF4F0]">
              "{previewImage.caption}"
            </p>
            <div className="flex items-center gap-3 text-xs text-[#7D6F74] dark:text-[#B8A8AF]">
              <span>📍 {previewImage.location || 'Nosso cantinho'}</span>
              <span>📅 {new Date(previewImage.date + 'T00:00:00').toLocaleDateString('pt-BR')}</span>
            </div>
          </div>
        </div>
      )}

      {/* Add Photo Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#241C21] rounded-3xl max-w-md w-full p-6 border border-[#F2E8E4] dark:border-[#3D2F36] shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-[#F2E8E4] dark:border-[#3D2F36]">
              <h3 className="font-serif font-bold text-lg text-[#2D2327] dark:text-[#FAF4F0]">
                Eternizar Nova Memória
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-xs text-[#7D6F74] hover:text-black dark:hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreatePhoto} className="space-y-3 text-xs sm:text-sm">
              <div>
                <label className="block font-medium text-[#2D2327] dark:text-[#FAF4F0] mb-1">
                  Upload da Foto ou Link de Imagem *
                </label>
                <div className="flex flex-col gap-2">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="block w-full text-xs text-[#7D6F74] file:mr-2 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-[#FAF3EC] file:text-[#E07A8B] hover:file:bg-[#F2E8E4]"
                  />
                  <span className="text-[11px] text-center text-[#7D6F74]">ou cole a URL direta:</span>
                  <input
                    type="url"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    placeholder="https://images.unsplash.com/..."
                    className="w-full px-3 py-2 rounded-xl bg-[#FAF8F5] dark:bg-[#2D2228] border border-[#F2E8E4] dark:border-[#3D2F36] text-[#2D2327] dark:text-[#FAF4F0] focus:outline-none focus:ring-1 focus:ring-[#E07A8B]"
                  />
                </div>
              </div>

              {imageUrl && (
                <div className="w-full h-32 rounded-xl overflow-hidden bg-zinc-100">
                  <img src={imageUrl} alt="Preview" className="w-full h-full object-cover" />
                </div>
              )}

              <div>
                <label className="block font-medium text-[#2D2327] dark:text-[#FAF4F0] mb-1">
                  Legenda / Frase especial *
                </label>
                <input
                  type="text"
                  required
                  value={newCaption}
                  onChange={(e) => setNewCaption(e.target.value)}
                  placeholder="Ex: O pôr do sol mais lindo ao seu lado..."
                  className="w-full px-3 py-2 rounded-xl bg-[#FAF8F5] dark:bg-[#2D2228] border border-[#F2E8E4] dark:border-[#3D2F36] text-[#2D2327] dark:text-[#FAF4F0] focus:outline-none focus:ring-1 focus:ring-[#E07A8B]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-[#2D2327] dark:text-[#FAF4F0] mb-1">
                    Localização
                  </label>
                  <input
                    type="text"
                    value={newLocation}
                    onChange={(e) => setNewLocation(e.target.value)}
                    placeholder="Ex: Praia da Joaquina"
                    className="w-full px-3 py-2 rounded-xl bg-[#FAF8F5] dark:bg-[#2D2228] border border-[#F2E8E4] dark:border-[#3D2F36] text-[#2D2327] dark:text-[#FAF4F0] focus:outline-none focus:ring-1 focus:ring-[#E07A8B]"
                  />
                </div>

                <div>
                  <label className="block font-medium text-[#2D2327] dark:text-[#FAF4F0] mb-1">
                    Data do Momento
                  </label>
                  <input
                    type="date"
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#FAF8F5] dark:bg-[#2D2228] border border-[#F2E8E4] dark:border-[#3D2F36] text-[#2D2327] dark:text-[#FAF4F0] focus:outline-none focus:ring-1 focus:ring-[#E07A8B]"
                  />
                </div>
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
                  disabled={!imageUrl}
                  className="px-5 py-2 rounded-xl bg-[#E07A8B] text-white font-medium shadow-xs disabled:opacity-50"
                >
                  Salvar no Álbum
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
