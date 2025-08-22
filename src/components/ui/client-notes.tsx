import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { 
  StickyNote, 
  Plus, 
  Edit, 
  Save, 
  X,
  Calendar,
  User
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Note {
  id: string;
  content: string;
  created_at: string;
  created_by?: string;
  type?: 'general' | 'important' | 'reminder';
}

interface ClientNotesProps {
  clientId: string;
  notes?: Note[];
  onAddNote?: (content: string, type: string) => void;
  onUpdateNote?: (noteId: string, content: string) => void;
  onDeleteNote?: (noteId: string) => void;
}

const noteTypes = {
  general: { label: 'Geral', className: 'bg-blue-100 text-blue-800 border-blue-200' },
  important: { label: 'Importante', className: 'bg-red-100 text-red-800 border-red-200' },
  reminder: { label: 'Lembrete', className: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
};

export function ClientNotes({ 
  clientId, 
  notes = [], 
  onAddNote, 
  onUpdateNote, 
  onDeleteNote 
}: ClientNotesProps) {
  const { toast } = useToast();
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newNoteContent, setNewNoteContent] = useState('');
  const [newNoteType, setNewNoteType] = useState<'general' | 'important' | 'reminder'>('general');
  const [editContent, setEditContent] = useState('');

  const handleAddNote = () => {
    if (!newNoteContent.trim()) {
      toast({
        title: "Erro",
        description: "Por favor, digite o conteúdo da nota.",
        variant: "destructive"
      });
      return;
    }

    onAddNote?.(newNoteContent, newNoteType);
    setNewNoteContent('');
    setNewNoteType('general');
    setIsAdding(false);
    
    toast({
      title: "Sucesso",
      description: "Nota adicionada com sucesso!",
    });
  };

  const handleEditNote = (note: Note) => {
    setEditingId(note.id);
    setEditContent(note.content);
  };

  const handleSaveEdit = (noteId: string) => {
    if (!editContent.trim()) {
      toast({
        title: "Erro",
        description: "Por favor, digite o conteúdo da nota.",
        variant: "destructive"
      });
      return;
    }

    onUpdateNote?.(noteId, editContent);
    setEditingId(null);
    setEditContent('');
    
    toast({
      title: "Sucesso",
      description: "Nota atualizada com sucesso!",
    });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditContent('');
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <StickyNote className="h-5 w-5" />
            Notas e Observações
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsAdding(true)}
            disabled={isAdding}
          >
            <Plus className="h-4 w-4 mr-1" />
            Nova Nota
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Formulário para nova nota */}
        {isAdding && (
          <div className="p-4 border rounded-lg bg-gray-50">
            <div className="space-y-3">
              <div className="flex gap-2">
                {Object.entries(noteTypes).map(([type, config]) => (
                  <Button
                    key={type}
                    variant={newNoteType === type ? "default" : "outline"}
                    size="sm"
                    onClick={() => setNewNoteType(type as any)}
                  >
                    {config.label}
                  </Button>
                ))}
              </div>
              <Textarea
                placeholder="Digite sua nota aqui..."
                value={newNoteContent}
                onChange={(e) => setNewNoteContent(e.target.value)}
                rows={3}
              />
              <div className="flex gap-2">
                <Button size="sm" onClick={handleAddNote}>
                  <Save className="h-4 w-4 mr-1" />
                  Salvar
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => {
                    setIsAdding(false);
                    setNewNoteContent('');
                    setNewNoteType('general');
                  }}
                >
                  <X className="h-4 w-4 mr-1" />
                  Cancelar
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Lista de notas */}
        {notes.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <StickyNote className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>Nenhuma nota encontrada</p>
            <p className="text-sm">Adicione a primeira nota para este cliente</p>
          </div>
        ) : (
          <div className="space-y-3">
            {notes.map((note) => (
              <div key={note.id} className="p-4 border rounded-lg">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Badge 
                      variant="outline" 
                      className={noteTypes[note.type || 'general'].className}
                    >
                      {noteTypes[note.type || 'general'].label}
                    </Badge>
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      <Calendar className="h-3 w-3" />
                      {formatDate(note.created_at)}
                    </div>
                    {note.created_by && (
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <User className="h-3 w-3" />
                        {note.created_by}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEditNote(note)}
                      className="h-8 w-8 p-0"
                    >
                      <Edit className="h-3 w-3" />
                    </Button>
                    {onDeleteNote && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onDeleteNote(note.id)}
                        className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </div>
                
                {editingId === note.id ? (
                  <div className="space-y-2">
                    <Textarea
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      rows={3}
                    />
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => handleSaveEdit(note.id)}>
                        <Save className="h-4 w-4 mr-1" />
                        Salvar
                      </Button>
                      <Button variant="outline" size="sm" onClick={handleCancelEdit}>
                        <X className="h-4 w-4 mr-1" />
                        Cancelar
                      </Button>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">{note.content}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}