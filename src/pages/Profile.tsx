'use client';

import { useState } from "react";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ImageUpload } from "@/components/ui/image-upload";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { 
  User, 
  Save, 
  Loader2,
  Mail,
  Calendar
} from "lucide-react";

export default function Profile() {
  const { user, updateProfile } = useAuth();
  const { toast } = useToast();

  const [loading, setLoading] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [formData, setFormData] = useState({
    full_name: user?.user_metadata?.full_name || '',
    phone: user?.user_metadata?.phone || '',
    address: user?.user_metadata?.address || '',
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };



  const ensureAvatarsBucket = async () => {
    try {
      // Primeiro, verificar se o bucket existe
      const { data: buckets } = await supabase.storage.listBuckets();
      const avatarsBucket = buckets?.find(bucket => bucket.name === 'avatars');
      
      if (!avatarsBucket) {
        // Tentar criar o bucket se não existir
        const { error } = await supabase.storage.createBucket('avatars', {
          public: true,
          allowedMimeTypes: ['image/*'],
          fileSizeLimit: 2097152 // 2MB
        });
        
        if (error) {
          console.warn('Erro ao criar bucket:', error);
          // Se não conseguir criar o bucket, vamos tentar fazer upload mesmo assim
        }
      }
    } catch (error) {
      console.warn('Erro ao verificar/criar bucket:', error);
    }
  };

  const handleAvatarUpload = async (file: File) => {
    if (!file || !user) return;

    // Validar tipo de arquivo
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Erro",
        description: "Por favor, selecione apenas arquivos de imagem.",
        variant: "destructive"
      });
      return;
    }

    // Validar tamanho do arquivo (máximo 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: "Erro",
        description: "A imagem deve ter no máximo 2MB.",
        variant: "destructive"
      });
      return;
    }

    setUploadingAvatar(true);

    try {
      // Garantir que o bucket existe
      await ensureAvatarsBucket();

      // Converter imagem para base64 como alternativa temporária
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const base64Image = await base64Promise;
      
      // Por enquanto, vamos usar base64 até o bucket ser configurado
      const publicUrl = base64Image;

      // Atualizar perfil do usuário com a nova URL do avatar
      const { error: updateError } = await supabase.auth.updateUser({
        data: {
          ...user.user_metadata,
          avatar_url: publicUrl
        }
      });

      if (updateError) {
        throw updateError;
      }

      toast({
        title: "Sucesso",
        description: "Avatar atualizado com sucesso!"
      });

    } catch (error: any) {
      console.error('Erro ao fazer upload do avatar:', error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao fazer upload do avatar.",
        variant: "destructive"
      });
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({
        data: {
          ...user.user_metadata,
          full_name: formData.full_name,
          phone: formData.phone,
          address: formData.address,
        }
      });

      if (error) {
        throw error;
      }

      toast({
        title: "Sucesso",
        description: "Perfil atualizado com sucesso!"
      });

    } catch (error: any) {
      console.error('Erro ao atualizar perfil:', error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao atualizar perfil.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Perfil</h1>
          <p className="text-muted-foreground">
            Gerencie suas informações pessoais e configurações de conta.
          </p>
        </div>

        <div className="grid gap-6">
          {/* Card do Avatar */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Foto do Perfil
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <ImageUpload
                  value={user?.user_metadata?.avatar_url}
                  onChange={handleAvatarUpload}
                  loading={uploadingAvatar}
                  fallback={getInitials(user?.user_metadata?.full_name || user?.email || 'U')}
                  size="lg"
                />
                <div>
                  <p className="font-medium">{user?.user_metadata?.full_name || 'Usuário'}</p>
                  <p className="text-sm text-muted-foreground">{user?.email}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Clique no ícone da câmera para alterar sua foto ou arraste uma imagem
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Card das Informações Pessoais */}
          <Card>
            <CardHeader>
              <CardTitle>Informações Pessoais</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="full_name">Nome Completo</Label>
                    <Input
                      id="full_name"
                      value={formData.full_name}
                      onChange={(e) => handleInputChange('full_name', e.target.value)}
                      placeholder="Seu nome completo"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">E-mail</Label>
                    <Input
                      id="email"
                      value={user?.email || ''}
                      disabled
                      className="bg-muted"
                    />
                    <p className="text-xs text-muted-foreground">
                      O e-mail não pode ser alterado
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Telefone</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      placeholder="(11) 99999-9999"
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="address">Endereço</Label>
                    <Input
                      id="address"
                      value={formData.address}
                      onChange={(e) => handleInputChange('address', e.target.value)}
                      placeholder="Seu endereço completo"
                    />
                  </div>
                </div>

                <Separator />

                <div className="flex justify-end">
                  <Button type="submit" disabled={loading}>
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Salvando...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Salvar Alterações
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Card de Informações da Conta */}
          <Card>
            <CardHeader>
              <CardTitle>Informações da Conta</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">E-mail</p>
                    <p className="text-sm text-muted-foreground">{user?.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Membro desde</p>
                    <p className="text-sm text-muted-foreground">
                      {user?.created_at ? new Date(user.created_at).toLocaleDateString('pt-BR') : 'N/A'}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}