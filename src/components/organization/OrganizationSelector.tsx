import React from 'react'
import { Building2, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/contexts/AuthContext'
import { useOrganizations } from '@/hooks/useOrganizations'

export function OrganizationSelector() {
  const { user, currentOrganization, setCurrentOrganization } = useAuth()
  const { organizations } = useOrganizations(user?.id)

  if (!currentOrganization) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground">
        <Building2 className="h-4 w-4" />
        <span>Carregando organização...</span>
      </div>
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="flex items-center gap-2 px-3 py-2 h-auto">
          <Building2 className="h-4 w-4" />
          <div className="flex flex-col items-start">
            <span className="text-sm font-medium">{currentOrganization.name}</span>
            <span className="text-xs text-muted-foreground">Organização atual</span>
          </div>
          <ChevronDown className="h-4 w-4 ml-auto" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-64">
        <DropdownMenuLabel>Suas Organizações</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {organizations.map((userOrg) => {
          const org = userOrg.organization!
          const isActive = org.id === currentOrganization.id
          
          return (
            <DropdownMenuItem
              key={org.id}
              onClick={() => setCurrentOrganization(org)}
              className={`flex items-center justify-between ${isActive ? 'bg-accent' : ''}`}
            >
              <div className="flex flex-col">
                <span className="font-medium">{org.name}</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">
                  {userOrg.role}
                </Badge>
                {isActive && (
                  <div className="w-2 h-2 bg-primary rounded-full" />
                )}
              </div>
            </DropdownMenuItem>
          )
        })}
        {organizations.length === 0 && (
          <DropdownMenuItem disabled>
            <span className="text-muted-foreground">Nenhuma organização encontrada</span>
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}