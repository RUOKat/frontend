"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  getMedicalProviders,
  createMedicalProvider,
  updateMedicalProvider,
  deleteMedicalProvider,
  type MedicalProvider,
  type CreateMedicalProviderData,
} from "@/lib/backend-medical-providers"
import {
  getAllPets,
  getAllCareLogs,
  type AdminPet,
  type AdminCareLog,
} from "@/lib/backend-admin"
import { Building2, Stethoscope, Hospital, Plus, Pencil, Trash2, Cat, ClipboardList } from "lucide-react"
import { useRouter } from "next/navigation"

export default function AdminPage() {
  const router = useRouter()
  const [providers, setProviders] = useState<MedicalProvider[]>([])
  const [pets, setPets] = useState<AdminPet[]>([])
  const [careLogs, setCareLogs] = useState<AdminCareLog[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [petDetailOpen, setPetDetailOpen] = useState(false)
  const [careLogDetailOpen, setCareLogDetailOpen] = useState(false)
  const [selectedPet, setSelectedPet] = useState<AdminPet | null>(null)
  const [selectedCareLog, setSelectedCareLog] = useState<AdminCareLog | null>(null)
  const [editingProvider, setEditingProvider] = useState<MedicalProvider | null>(null)
  const [formData, setFormData] = useState<CreateMedicalProviderData>({
    type: "hospital",
    name: "",
    address: "",
    phone: "",
    specialty: "",
    notes: "",
  })

  useEffect(() => {
    loadAllData()
  }, [])

  const loadAllData = async () => {
    setLoading(true)
    await Promise.all([
      loadProviders(),
      loadPets(),
      loadCareLogs(),
    ])
    setLoading(false)
  }

  const loadProviders = async () => {
    const data = await getMedicalProviders()
    setProviders(data)
  }

  const loadPets = async () => {
    const data = await getAllPets()
    setPets(data)
  }

  const loadCareLogs = async () => {
    const data = await getAllCareLogs()
    setCareLogs(data)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (editingProvider) {
      const updated = await updateMedicalProvider(editingProvider.id, formData)
      if (updated) {
        await loadProviders()
        resetForm()
      }
    } else {
      const created = await createMedicalProvider(formData)
      if (created) {
        await loadProviders()
        resetForm()
      }
    }
  }

  const handleEdit = (provider: MedicalProvider) => {
    setEditingProvider(provider)
    setFormData({
      type: provider.type,
      name: provider.name,
      address: provider.address || "",
      phone: provider.phone || "",
      specialty: provider.specialty || "",
      notes: provider.notes || "",
    })
    setDialogOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (confirm("정말 삭제하시겠습니까?")) {
      const success = await deleteMedicalProvider(id)
      if (success) {
        await loadProviders()
      }
    }
  }

  const handlePetClick = (pet: AdminPet) => {
    setSelectedPet(pet)
    setPetDetailOpen(true)
  }

  const handleCareLogClick = (log: AdminCareLog) => {
    setSelectedCareLog(log)
    setCareLogDetailOpen(true)
  }

  const resetForm = () => {
    setFormData({
      type: "hospital",
      name: "",
      address: "",
      phone: "",
      specialty: "",
      notes: "",
    })
    setEditingProvider(null)
    setDialogOpen(false)
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "hospital":
        return <Hospital className="w-5 h-5" />
      case "clinic":
        return <Building2 className="w-5 h-5" />
      case "doctor":
        return <Stethoscope className="w-5 h-5" />
      default:
        return <Building2 className="w-5 h-5" />
    }
  }

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "hospital":
        return "병원"
      case "clinic":
        return "클리닉"
      case "doctor":
        return "의사"
      default:
        return type
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="px-6 pt-safe-top border-b">
        <div className="py-6">
          <h1 className="text-2xl font-bold text-foreground">관리자 페이지</h1>
        </div>
      </header>

      <main className="px-6 py-6">
        <Tabs defaultValue="providers" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="providers">기관/의사</TabsTrigger>
            <TabsTrigger value="pets">고양이</TabsTrigger>
            <TabsTrigger value="logs">진료내역</TabsTrigger>
          </TabsList>

          {/* 기관/의사 탭 */}
          <TabsContent value="providers" className="space-y-4">
            <div className="flex justify-end">
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button onClick={() => resetForm()}>
                    <Plus className="w-4 h-4 mr-2" />
                    등록
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>
                      {editingProvider ? "기관/의사 수정" : "기관/의사 등록"}
                    </DialogTitle>
                    <DialogDescription>
                      {editingProvider ? "기관/의사 정보를 수정합니다." : "새로운 기관/의사를 등록합니다."}
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="type">타입</Label>
                      <Select
                        value={formData.type}
                        onValueChange={(value) => setFormData({ ...formData, type: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="hospital">병원</SelectItem>
                          <SelectItem value="clinic">클리닉</SelectItem>
                          <SelectItem value="doctor">의사</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="name">이름 *</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="기관명 또는 의사명"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="address">주소</Label>
                      <Input
                        id="address"
                        value={formData.address}
                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                        placeholder="주소"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phone">연락처</Label>
                      <Input
                        id="phone"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        placeholder="010-0000-0000"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="specialty">전문 분야</Label>
                      <Input
                        id="specialty"
                        value={formData.specialty}
                        onChange={(e) => setFormData({ ...formData, specialty: e.target.value })}
                        placeholder="예: 내과, 외과, 치과"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="notes">메모</Label>
                      <Textarea
                        id="notes"
                        value={formData.notes}
                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                        placeholder="추가 정보"
                        rows={3}
                      />
                    </div>

                    <div className="flex gap-2 pt-4">
                      <Button type="button" variant="outline" onClick={resetForm} className="flex-1">
                        취소
                      </Button>
                      <Button type="submit" className="flex-1">
                        {editingProvider ? "수정" : "등록"}
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            {loading ? (
              <div className="text-center py-12 text-muted-foreground">로딩 중...</div>
            ) : providers.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  등록된 기관/의사가 없습니다.
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {providers.map((provider) => (
                  <Card key={provider.id}>
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                            {getTypeIcon(provider.type)}
                          </div>
                          <div>
                            <CardTitle className="text-lg">{provider.name}</CardTitle>
                            <p className="text-sm text-muted-foreground">
                              {getTypeLabel(provider.type)}
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(provider)}
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(provider.id)}
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {provider.address && (
                        <p className="text-sm text-muted-foreground">📍 {provider.address}</p>
                      )}
                      {provider.phone && (
                        <p className="text-sm text-muted-foreground">📞 {provider.phone}</p>
                      )}
                      {provider.specialty && (
                        <p className="text-sm text-muted-foreground">
                          🏥 전문 분야: {provider.specialty}
                        </p>
                      )}
                      {provider.notes && (
                        <p className="text-sm text-muted-foreground border-t pt-2 mt-2">
                          {provider.notes}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* 고양이 탭 */}
          <TabsContent value="pets" className="space-y-4">
            {loading ? (
              <div className="text-center py-12 text-muted-foreground">로딩 중...</div>
            ) : pets.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  등록된 고양이가 없습니다.
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {pets.map((pet) => (
                  <Card 
                    key={pet.id} 
                    className="cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => handlePetClick(pet)}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <Cat className="w-5 h-5" />
                        </div>
                        <div>
                          <CardTitle className="text-lg">{pet.name}</CardTitle>
                          <p className="text-sm text-muted-foreground">
                            {pet.user.name || pet.user.email}
                          </p>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <p className="text-sm text-muted-foreground">품종: {pet.breed}</p>
                      <p className="text-sm text-muted-foreground">
                        성별: {pet.gender === "male" ? "수컷" : "암컷"}
                      </p>
                      <p className="text-sm text-muted-foreground">체중: {pet.weight}kg</p>
                      {pet.birthDate && (
                        <p className="text-sm text-muted-foreground">
                          생년월일: {new Date(pet.birthDate).toLocaleDateString("ko-KR")}
                        </p>
                      )}
                      <p className="text-sm text-muted-foreground border-t pt-2 mt-2">
                        등록일: {new Date(pet.createdAt).toLocaleDateString("ko-KR")}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* 고양이 상세 정보 Dialog */}
            <Dialog open={petDetailOpen} onOpenChange={setPetDetailOpen}>
              <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>고양이 상세 정보</DialogTitle>
                  <DialogDescription>
                    고양이의 상세 정보와 보호자 정보를 확인할 수 있습니다.
                  </DialogDescription>
                </DialogHeader>
                {selectedPet && (
                  <div className="space-y-6">
                    {/* 기본 정보 */}
                    <div className="space-y-3">
                      <h3 className="font-semibold text-lg border-b pb-2">기본 정보</h3>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <p className="text-sm text-muted-foreground">이름</p>
                          <p className="font-medium">{selectedPet.name}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">품종</p>
                          <p className="font-medium">{selectedPet.breed}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">성별</p>
                          <p className="font-medium">
                            {selectedPet.gender === "male" ? "수컷" : "암컷"}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">체중</p>
                          <p className="font-medium">{selectedPet.weight}kg</p>
                        </div>
                        {selectedPet.birthDate && (
                          <div>
                            <p className="text-sm text-muted-foreground">생년월일</p>
                            <p className="font-medium">
                              {new Date(selectedPet.birthDate).toLocaleDateString("ko-KR")}
                            </p>
                          </div>
                        )}
                        <div>
                          <p className="text-sm text-muted-foreground">등록일</p>
                          <p className="font-medium">
                            {new Date(selectedPet.createdAt).toLocaleDateString("ko-KR")}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* 보호자 정보 */}
                    <div className="space-y-3">
                      <h3 className="font-semibold text-lg border-b pb-2">보호자 정보</h3>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <p className="text-sm text-muted-foreground">이름</p>
                          <p className="font-medium">{selectedPet.user.name || "-"}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">이메일</p>
                          <p className="font-medium">{selectedPet.user.email || "-"}</p>
                        </div>
                      </div>
                    </div>

                    {/* 추가 정보 */}
                    {(selectedPet as any).foodType && (
                      <div className="space-y-3">
                        <h3 className="font-semibold text-lg border-b pb-2">식이 정보</h3>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <p className="text-sm text-muted-foreground">사료 타입</p>
                            <p className="font-medium">{(selectedPet as any).foodType}</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">물 공급원</p>
                            <p className="font-medium">{(selectedPet as any).waterSource}</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* 의료 정보 */}
                    {(selectedPet as any).medicalHistory && (
                      <div className="space-y-3">
                        <h3 className="font-semibold text-lg border-b pb-2">의료 정보</h3>
                        <div className="text-sm">
                          <pre className="whitespace-pre-wrap bg-muted p-3 rounded">
                            {JSON.stringify((selectedPet as any).medicalHistory, null, 2)}
                          </pre>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </DialogContent>
            </Dialog>
          </TabsContent>

          {/* 진료내역 탭 */}
          <TabsContent value="logs" className="space-y-4">
            {loading ? (
              <div className="text-center py-12 text-muted-foreground">로딩 중...</div>
            ) : careLogs.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  진료내역이 없습니다.
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {careLogs.map((log) => (
                  <Card 
                    key={log.id}
                    className="cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => handleCareLogClick(log)}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <ClipboardList className="w-5 h-5" />
                        </div>
                        <div>
                          <CardTitle className="text-lg">{log.pet.name}</CardTitle>
                          <p className="text-sm text-muted-foreground">
                            {log.pet.user.name || log.pet.user.email}
                          </p>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <p className="text-sm text-muted-foreground">날짜: {log.date}</p>
                      <p className="text-sm text-muted-foreground">
                        타입: {log.type === "checkin" ? "간편 체크인" : "진단"}
                      </p>
                      {log.answers && (
                        <p className="text-sm text-muted-foreground">
                          기본 답변: {Object.keys(log.answers).length}개
                        </p>
                      )}
                      {log.diagAnswers && (
                        <p className="text-sm text-muted-foreground">
                          진단 답변: {Object.keys(log.diagAnswers).length}개
                        </p>
                      )}
                      <p className="text-sm text-muted-foreground border-t pt-2 mt-2">
                        기록일: {new Date(log.createdAt).toLocaleString("ko-KR")}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* 진료내역 상세 정보 Dialog */}
            <Dialog open={careLogDetailOpen} onOpenChange={setCareLogDetailOpen}>
              <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>진료내역 상세</DialogTitle>
                  <DialogDescription>
                    진료내역의 상세 정보와 답변 내용을 확인할 수 있습니다.
                  </DialogDescription>
                </DialogHeader>
                {selectedCareLog && (
                  <div className="space-y-6">
                    {/* 기본 정보 */}
                    <div className="space-y-3">
                      <h3 className="font-semibold text-lg border-b pb-2">기본 정보</h3>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <p className="text-sm text-muted-foreground">고양이</p>
                          <p className="font-medium">{selectedCareLog.pet.name}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">보호자</p>
                          <p className="font-medium">
                            {selectedCareLog.pet.user.name || selectedCareLog.pet.user.email}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">날짜</p>
                          <p className="font-medium">{selectedCareLog.date}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">타입</p>
                          <p className="font-medium">
                            {selectedCareLog.type === "checkin" ? "간편 체크인" : "진단"}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">기록일시</p>
                          <p className="font-medium">
                            {new Date(selectedCareLog.createdAt).toLocaleString("ko-KR")}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* 기본 답변 */}
                    {selectedCareLog.answers && (
                      <div className="space-y-3">
                        <h3 className="font-semibold text-lg border-b pb-2">기본 체크인 답변</h3>
                        <div className="space-y-2">
                          {Object.entries(selectedCareLog.answers).map(([key, value]) => (
                            <div key={key} className="flex justify-between items-center p-2 bg-muted rounded">
                              <span className="text-sm font-medium">{key}</span>
                              <span className="text-sm text-muted-foreground">
                                {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* 진단 답변 */}
                    {selectedCareLog.diagAnswers && (
                      <div className="space-y-3">
                        <h3 className="font-semibold text-lg border-b pb-2">진단 설문 답변</h3>
                        <div className="space-y-2">
                          {Object.entries(selectedCareLog.diagAnswers).map(([key, value]) => (
                            <div key={key} className="flex justify-between items-center p-2 bg-muted rounded">
                              <span className="text-sm font-medium">{key}</span>
                              <span className="text-sm text-muted-foreground">
                                {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* 알림 전송 정보 */}
                    {((selectedCareLog as any).diagNotificationSentAt || (selectedCareLog as any).reportNotificationSentAt) && (
                      <div className="space-y-3">
                        <h3 className="font-semibold text-lg border-b pb-2">알림 전송 정보</h3>
                        <div className="grid grid-cols-2 gap-3">
                          {(selectedCareLog as any).diagNotificationSentAt && (
                            <div>
                              <p className="text-sm text-muted-foreground">진단 알림 전송</p>
                              <p className="font-medium">
                                {new Date((selectedCareLog as any).diagNotificationSentAt).toLocaleString("ko-KR")}
                              </p>
                            </div>
                          )}
                          {(selectedCareLog as any).reportNotificationSentAt && (
                            <div>
                              <p className="text-sm text-muted-foreground">리포트 알림 전송</p>
                              <p className="font-medium">
                                {new Date((selectedCareLog as any).reportNotificationSentAt).toLocaleString("ko-KR")}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Raw JSON 데이터 */}
                    <div className="space-y-3">
                      <h3 className="font-semibold text-lg border-b pb-2">전체 데이터 (JSON)</h3>
                      <pre className="text-xs bg-muted p-3 rounded overflow-x-auto">
                        {JSON.stringify(selectedCareLog, null, 2)}
                      </pre>
                    </div>
                  </div>
                )}
              </DialogContent>
            </Dialog>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
