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
  getCareLogsByPet,
  deletePet,
  getAllPetcamImages,
  type AdminPet,
  type AdminCareLog,
  type AdminPetcamImage,
} from "@/lib/backend-admin"
import { Building2, Stethoscope, Hospital, Plus, Pencil, Trash2, Cat, ClipboardList, Camera } from "lucide-react"

// 질문 key를 한글로 매핑
const QUESTION_LABELS: Record<string, string> = {
  q1_food_intake: "식사량",
  q2_water_intake: "음수량",
  q3_weight: "체중 (kg)",
  q4_poop: "배변 상태",
  q5_urine: "배뇨량",
  q6_custom: "맞춤 질문",
  // 기존 질문들
  q1_urinary_male: "배뇨 상태 (수컷)",
  q1_urinary_general: "화장실 패턴",
  q2_water_senior: "음수량 변화 (시니어)",
  q2_water_general: "음수량",
  q3_vomiting: "구토 빈도",
  q4_mobility_senior: "움직임 (시니어)",
  q4_activity_general: "활동량",
  q5_appetite: "식욕 변화",
}

// 질문 전체 텍스트 매핑
const QUESTION_TEXTS: Record<string, string> = {
  q1_food_intake: "오늘 식사량은 어땠나요?",
  q2_water_intake: "오늘 물은 얼마나 마셨나요?",
  q3_weight: "오늘 체중을 입력해주세요 (kg)",
  q4_poop: "오늘 배변 상태는 어땠나요?",
  q5_urine: "오늘 배뇨량은 어땠나요?",
  q6_custom: "맞춤 질문",
  // 기존 질문들
  q1_urinary_male: "화장실에서 소변 볼 때 평소보다 오래 앉아 있거나 힘들어하는 것 같나요?",
  q1_urinary_general: "최근 화장실 사용 횟수나 패턴에 변화가 있었나요?",
  q2_water_senior: "물을 마시는 양이 예전보다 늘었다고 느끼시나요?",
  q2_water_general: "하루에 물을 얼마나 마시는 것 같나요?",
  q3_vomiting: "최근 2주 동안 구토한 적이 있나요?",
  q4_mobility_senior: "높은 곳으로 뛰어오르거나 계단 오르는 걸 피하는 것 같나요?",
  q4_activity_general: "평소 활동량은 어떤 편인가요?",
  q5_appetite: "최근 식욕에 변화가 있었나요?",
  // followUp 질문들
  fu_flutd_1: "배뇨 시 울음소리를 내거나 불편해 보이나요?",
  fu_flutd_2: "소변 색이 진하거나 피가 섞인 것 같나요?",
  fu_flutd_3: "화장실에 자주 가는데 소변량이 적은 것 같나요?",
  fu_ckd_1: "물 섭취량이 눈에 띄게 증가했나요?",
  fu_ckd_2: "배뇨 횟수나 소변량이 증가했나요?",
  fu_ckd_3: "체중이 감소한 것 같나요?",
  fu_gi_1: "최근 2주 내 구토가 주 1회 이상 있었나요?",
  fu_gi_2: "묽은 변의 빈도는 어떤가요?",
  fu_gi_3: "식욕이 감소했나요?",
  fu_pain_1: "점프나 계단을 피하는 것 같나요?",
  fu_pain_2: "그루밍이 줄었거나 만지면 싫어하나요?",
  fu_pain_3: "숨는 시간이 늘었나요?",
}

// 답변 value를 한글로 매핑
const ANSWER_LABELS: Record<string, string> = {
  // 식사량
  none: "안 먹음",
  less: "평소보다 적게",
  normal: "평소만큼",
  more: "평소보다 많이",
  // 배변
  diarrhea: "설사",
  // 기존 답변들
  never: "전혀 없어요",
  rarely: "가끔 그래요",
  often: "자주 그래요",
  unknown: "잘 모르겠어요",
  same: "똑같아요",
  little_more: "조금 늘었어요",
  much_more: "많이 늘었어요",
  little: "적게 마셔요",
  much: "많이 마셔요",
  once: "1-2번",
  weekly: "주 1회 이상",
  daily: "거의 매일",
  no: "아니요",
  yes: "예",
  sometimes: "가끔 주저해요",
  active: "활발해요",
  lazy: "조용한 편이에요",
  decreased: "최근 줄었어요",
  increased: "더 먹어요",
  picky: "까다로워졌어요",
  slight: "약간",
  clear: "뚜렷함",
}

// 답변 값에 따른 색상
const getAnswerColor = (key: string, value: string): string => {
  // 체중은 숫자이므로 기본 색상
  if (key === "q3_weight") return "text-foreground"
  
  // 정상/평소 수준
  if (value === "normal" || value === "same") return "text-green-600"
  
  // 위험 신호
  if (value === "none" || value === "diarrhea" || value === "daily" || 
      value === "much_more" || value === "clear") return "text-red-600"
  
  // 주의 필요
  if (value === "less" || value === "more" || value === "often" || 
      value === "weekly" || value === "decreased" || value === "slight") return "text-amber-600"
  
  return "text-foreground"
}

export default function AdminPage() {
  const [providers, setProviders] = useState<MedicalProvider[]>([])
  const [pets, setPets] = useState<AdminPet[]>([])
  const [petCareLogs, setPetCareLogs] = useState<AdminCareLog[]>([])
  const [petcamImages, setPetcamImages] = useState<AdminPetcamImage[]>([])
  const [loading, setLoading] = useState(true)
  const [petcamLoading, setPetcamLoading] = useState(false)
  const [careLogsLoading, setCareLogsLoading] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [petDetailOpen, setPetDetailOpen] = useState(false)
  const [careLogDetailOpen, setCareLogDetailOpen] = useState(false)
  const [petcamDetailOpen, setPetcamDetailOpen] = useState(false)
  const [selectedPet, setSelectedPet] = useState<AdminPet | null>(null)
  const [selectedCareLog, setSelectedCareLog] = useState<AdminCareLog | null>(null)
  const [selectedPetcamImage, setSelectedPetcamImage] = useState<AdminPetcamImage | null>(null)
  const [petcamFilterPetId, setPetcamFilterPetId] = useState<string>("all")
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

  const loadPetcamImages = async () => {
    setPetcamLoading(true)
    const data = await getAllPetcamImages()
    setPetcamImages(data)
    setPetcamLoading(false)
  }

  const loadPetCareLogs = async (petId: string) => {
    setCareLogsLoading(true)
    const data = await getCareLogsByPet(petId)
    setPetCareLogs(data)
    setCareLogsLoading(false)
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

  const handlePetClick = async (pet: AdminPet) => {
    setSelectedPet(pet)
    setPetDetailOpen(true)
    await loadPetCareLogs(pet.id)
  }

  const handleCareLogClick = (log: AdminCareLog) => {
    setSelectedCareLog(log)
    setCareLogDetailOpen(true)
  }

  const handleDeletePet = async (e: React.MouseEvent, petId: string, petName: string) => {
    e.stopPropagation()
    if (confirm(`정말 "${petName}"을(를) 삭제하시겠습니까?`)) {
      const success = await deletePet(petId)
      if (success) {
        await loadPets()
        setPetDetailOpen(false)
        setSelectedPet(null)
      }
    }
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
        <Tabs defaultValue="pets" className="w-full">
          {/* 탭 선택 버튼 */}
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="pets">고양이</TabsTrigger>
            <TabsTrigger value="petcam" onClick={() => petcamImages.length === 0 && loadPetcamImages()}>펫캠 모니터링</TabsTrigger>
          </TabsList>

          {/* 기관/의사 탭 비활성화
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
          */}

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
                        {pet.profilePhoto ? (
                          <img 
                            src={pet.profilePhoto} 
                            alt={pet.name}
                            className="w-12 h-12 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                            <Cat className="w-6 h-6" />
                          </div>
                        )}
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
                        성별: {pet.gender === "male" ? "수컷" : "암컷"} {pet.neutered ? "(중성화)" : ""}
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
                    {/* 프로필 사진 */}
                    <div className="flex justify-center">
                      {selectedPet.profilePhoto ? (
                        <img 
                          src={selectedPet.profilePhoto} 
                          alt={selectedPet.name}
                          className="w-32 h-32 rounded-full object-cover border-4 border-primary/20"
                        />
                      ) : (
                        <div className="w-32 h-32 rounded-full bg-primary/10 flex items-center justify-center border-4 border-primary/20">
                          <Cat className="w-16 h-16 text-primary/50" />
                        </div>
                      )}
                    </div>

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
                          <p className="text-sm text-muted-foreground">중성화</p>
                          <p className="font-medium">{selectedPet.neutered ? "완료" : "미완료"}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">체중</p>
                          <p className="font-medium">{selectedPet.weight}kg</p>
                        </div>
                        {selectedPet.bcs && (
                          <div>
                            <p className="text-sm text-muted-foreground">BCS</p>
                            <p className="font-medium">{selectedPet.bcs}</p>
                          </div>
                        )}
                        {selectedPet.birthDate && (
                          <div>
                            <p className="text-sm text-muted-foreground">생년월일</p>
                            <p className="font-medium">
                              {new Date(selectedPet.birthDate).toLocaleDateString("ko-KR")}
                            </p>
                          </div>
                        )}
                        {selectedPet.estimatedAge && (
                          <div>
                            <p className="text-sm text-muted-foreground">추정 나이</p>
                            <p className="font-medium">{selectedPet.estimatedAge}세</p>
                          </div>
                        )}
                        {selectedPet.familyDate && (
                          <div>
                            <p className="text-sm text-muted-foreground">가족이 된 날</p>
                            <p className="font-medium">
                              {new Date(selectedPet.familyDate).toLocaleDateString("ko-KR")}
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

                    {/* 입양 정보 */}
                    {selectedPet.adoptionPath && (
                      <div className="space-y-3">
                        <h3 className="font-semibold text-lg border-b pb-2">입양 정보</h3>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <p className="text-sm text-muted-foreground">입양 경로</p>
                            <p className="font-medium">{selectedPet.adoptionPath}</p>
                          </div>
                          {selectedPet.adoptionSource && (
                            <div>
                              <p className="text-sm text-muted-foreground">입양처</p>
                              <p className="font-medium">{selectedPet.adoptionSource}</p>
                            </div>
                          )}
                          {selectedPet.adoptionAgencyCode && (
                            <div>
                              <p className="text-sm text-muted-foreground">기관 코드</p>
                              <p className="font-medium">{selectedPet.adoptionAgencyCode}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* 식이/생활 정보 */}
                    <div className="space-y-3">
                      <h3 className="font-semibold text-lg border-b pb-2">식이/생활 정보</h3>
                      <div className="grid grid-cols-2 gap-3">
                        {selectedPet.foodType && (
                          <div>
                            <p className="text-sm text-muted-foreground">사료 타입</p>
                            <p className="font-medium">{selectedPet.foodType}</p>
                          </div>
                        )}
                        {selectedPet.waterSource && (
                          <div>
                            <p className="text-sm text-muted-foreground">물 공급원</p>
                            <p className="font-medium">{selectedPet.waterSource}</p>
                          </div>
                        )}
                        {selectedPet.mealsPerDay && (
                          <div>
                            <p className="text-sm text-muted-foreground">하루 식사 횟수</p>
                            <p className="font-medium">{selectedPet.mealsPerDay}회</p>
                          </div>
                        )}
                        {selectedPet.waterIntakeTendency && (
                          <div>
                            <p className="text-sm text-muted-foreground">음수량 경향</p>
                            <p className="font-medium">{selectedPet.waterIntakeTendency}</p>
                          </div>
                        )}
                        {selectedPet.activityLevel && (
                          <div>
                            <p className="text-sm text-muted-foreground">활동량</p>
                            <p className="font-medium">{selectedPet.activityLevel}</p>
                          </div>
                        )}
                        {selectedPet.livingEnvironment && (
                          <div>
                            <p className="text-sm text-muted-foreground">생활 환경</p>
                            <p className="font-medium">{selectedPet.livingEnvironment}</p>
                          </div>
                        )}
                        {selectedPet.multiCat !== undefined && (
                          <div>
                            <p className="text-sm text-muted-foreground">다묘 가정</p>
                            <p className="font-medium">
                              {selectedPet.multiCat ? `예 (${selectedPet.catCount || 0}마리)` : "아니오"}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* 설문 설정 */}
                    {(selectedPet.surveyFrequencyPerWeek || selectedPet.surveyDays?.length) && (
                      <div className="space-y-3">
                        <h3 className="font-semibold text-lg border-b pb-2">설문 설정</h3>
                        <div className="grid grid-cols-2 gap-3">
                          {selectedPet.surveyFrequencyPerWeek && (
                            <div>
                              <p className="text-sm text-muted-foreground">주간 설문 횟수</p>
                              <p className="font-medium">{selectedPet.surveyFrequencyPerWeek}회</p>
                            </div>
                          )}
                          {selectedPet.surveyDays && selectedPet.surveyDays.length > 0 && (
                            <div>
                              <p className="text-sm text-muted-foreground">설문 요일</p>
                              <p className="font-medium">{selectedPet.surveyDays.join(", ")}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* 의료 정보 */}
                    <div className="space-y-3">
                      <h3 className="font-semibold text-lg border-b pb-2">의료 정보</h3>
                      <div className="space-y-3">
                        {selectedPet.medications && (
                          <div>
                            <p className="text-sm text-muted-foreground">복용 약물</p>
                            <p className="font-medium">{selectedPet.medications}</p>
                          </div>
                        )}
                        {selectedPet.medicationText && (
                          <div>
                            <p className="text-sm text-muted-foreground">약물 상세</p>
                            <p className="font-medium">{selectedPet.medicationText}</p>
                          </div>
                        )}
                        {selectedPet.vetInfo && (
                          <div>
                            <p className="text-sm text-muted-foreground">담당 수의사</p>
                            <p className="font-medium">{selectedPet.vetInfo}</p>
                          </div>
                        )}
                        {selectedPet.medicalHistory && (
                          <div>
                            <p className="text-sm text-muted-foreground">의료 기록</p>
                            <pre className="text-sm bg-muted p-3 rounded overflow-hidden whitespace-pre-wrap break-all">
                              {JSON.stringify(selectedPet.medicalHistory, null, 2)}
                            </pre>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* 메모 */}
                    {selectedPet.notes && (
                      <div className="space-y-3">
                        <h3 className="font-semibold text-lg border-b pb-2">메모</h3>
                        <p className="text-sm">{selectedPet.notes}</p>
                      </div>
                    )}

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
                        {selectedPet.user.phoneNumber && (
                          <div>
                            <p className="text-sm text-muted-foreground">연락처</p>
                            <p className="font-medium">{selectedPet.user.phoneNumber}</p>
                          </div>
                        )}
                        {selectedPet.user.address && (
                          <div>
                            <p className="text-sm text-muted-foreground">주소</p>
                            <p className="font-medium">{selectedPet.user.address}</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* 데이터 공유 정보 */}
                    {selectedPet.dataSharing && (
                      <div className="space-y-3">
                        <h3 className="font-semibold text-lg border-b pb-2">데이터 공유</h3>
                        <pre className="text-sm bg-muted p-3 rounded overflow-hidden whitespace-pre-wrap break-all">
                          {JSON.stringify(selectedPet.dataSharing, null, 2)}
                        </pre>
                      </div>
                    )}

                    {/* 진료내역 */}
                    <div className="space-y-3">
                      <h3 className="font-semibold text-lg border-b pb-2">
                        진료내역 ({petCareLogs.length}건)
                      </h3>
                      {careLogsLoading ? (
                        <div className="text-center py-4 text-muted-foreground">로딩 중...</div>
                      ) : petCareLogs.length === 0 ? (
                        <p className="text-sm text-muted-foreground py-4 text-center">
                          진료내역이 없습니다.
                        </p>
                      ) : (
                        <div className="space-y-2 max-h-80 overflow-y-auto">
                          {petCareLogs.map((log) => (
                            <div
                              key={log.id}
                              className="p-3 bg-muted rounded-lg cursor-pointer hover:bg-muted/80 transition-colors"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleCareLogClick(log)
                              }}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <ClipboardList className="w-4 h-4 text-primary" />
                                  <span className="font-medium">{log.date}</span>
                                </div>
                                <span className="text-xs text-muted-foreground">
                                  {log.type === "checkin" ? "간편 체크인" : "진단"}
                                </span>
                              </div>
                              <div className="mt-1 text-xs text-muted-foreground">
                                {log.answers && `기본 답변: ${Object.keys(log.answers).length}개`}
                                {log.answers && log.diagAnswers && " / "}
                                {log.diagAnswers && `진단 답변: ${Object.keys(log.diagAnswers).length}개`}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Raw JSON 데이터 */}
                    <div className="space-y-3">
                      <h3 className="font-semibold text-lg border-b pb-2">전체 데이터 (JSON)</h3>
                      <pre className="text-xs bg-muted p-3 rounded overflow-hidden whitespace-pre-wrap break-all">
                        {JSON.stringify(selectedPet, null, 2)}
                      </pre>
                    </div>

                    {/* 삭제 버튼 */}
                    <div className="pt-4 border-t">
                      <Button
                        variant="destructive"
                        className="w-full"
                        onClick={(e) => handleDeletePet(e, selectedPet.id, selectedPet.name)}
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        이 고양이 삭제
                      </Button>
                    </div>
                  </div>
                )}
              </DialogContent>
            </Dialog>

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
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {Object.entries(selectedCareLog.answers).map(([key, value]) => {
                            const label = QUESTION_LABELS[key] || key
                            const displayValue = typeof value === 'string' 
                              ? (ANSWER_LABELS[value] || value)
                              : typeof value === 'number'
                                ? value.toString()
                                : JSON.stringify(value)
                            const colorClass = typeof value === 'string' 
                              ? getAnswerColor(key, value) 
                              : "text-foreground"
                            
                            return (
                              <div key={key} className="p-3 bg-muted rounded-lg">
                                <p className="text-xs text-muted-foreground mb-1">{label}</p>
                                <p className={`font-medium ${colorClass}`}>{displayValue}</p>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )}

                    {/* 진단 답변 */}
                    {selectedCareLog.diagAnswers && (
                      <div className="space-y-3">
                        <h3 className="font-semibold text-lg border-b pb-2">진단 설문 답변</h3>
                        <div className="space-y-3">
                          {Object.entries(selectedCareLog.diagAnswers).map(([key, value]) => {
                            // diagQuestions에서 해당 질문 찾기
                            const question = Array.isArray(selectedCareLog.diagQuestions) 
                              ? selectedCareLog.diagQuestions.find((q: any) => q.id === key)
                              : null
                            
                            const label = question?.text || QUESTION_LABELS[key] || key
                            const questionText = question?.description || QUESTION_TEXTS[key] || ""
                            
                            // 선택된 옵션의 label 찾기
                            let displayValue: string
                            if (question?.options && typeof value === 'string') {
                              const selectedOption = question.options.find((opt: any) => opt.value === value)
                              displayValue = selectedOption?.label || ANSWER_LABELS[value] || value
                            } else if (typeof value === 'string') {
                              displayValue = ANSWER_LABELS[value] || value
                            } else if (typeof value === 'number') {
                              displayValue = value.toString()
                            } else {
                              displayValue = JSON.stringify(value)
                            }
                            
                            const colorClass = typeof value === 'string' 
                              ? getAnswerColor(key, value) 
                              : "text-foreground"
                            
                            return (
                              <div key={key} className="p-4 bg-muted rounded-lg">
                                <p className="text-sm font-medium text-foreground mb-1">{label}</p>
                                {questionText && (
                                  <p className="text-xs text-muted-foreground mb-2">{questionText}</p>
                                )}
                                <p className={`font-semibold text-lg ${colorClass}`}>{displayValue}</p>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )}

                    {/* Raw JSON 데이터 */}
                    <div className="space-y-3">
                      <h3 className="font-semibold text-lg border-b pb-2">전체 데이터 (JSON)</h3>
                      <pre className="text-xs bg-muted p-3 rounded overflow-hidden whitespace-pre-wrap break-all">
                        {JSON.stringify(selectedCareLog, null, 2)}
                      </pre>
                    </div>
                  </div>
                )}
              </DialogContent>
            </Dialog>
          </TabsContent>

          {/* 펫캠 모니터링 탭 */}
          <TabsContent value="petcam" className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
              <div className="flex items-center gap-3">
                <Select value={petcamFilterPetId} onValueChange={setPetcamFilterPetId}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="고양이 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">전체 고양이</SelectItem>
                    {/* 펫캠 이미지에서 고유한 고양이 목록 추출 */}
                    {Array.from(new Map(petcamImages.map(img => [img.petId, img.petName])))
                      .filter(([petId]) => petId)
                      .map(([petId, petName]) => (
                        <SelectItem key={petId} value={petId}>{petName}</SelectItem>
                      ))
                    }
                  </SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground">
                  {petcamFilterPetId === "all" 
                    ? `총 ${petcamImages.length}개` 
                    : `${petcamImages.filter(img => img.petId === petcamFilterPetId).length}개`
                  }
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={loadPetcamImages} disabled={petcamLoading}>
                {petcamLoading ? "로딩 중..." : "새로고침"}
              </Button>
            </div>

            {petcamLoading ? (
              <div className="text-center py-12 text-muted-foreground">로딩 중...</div>
            ) : petcamImages.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  펫캠 이미지가 없습니다.
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {petcamImages
                  .filter(image => petcamFilterPetId === "all" || image.petId === petcamFilterPetId)
                  .map((image) => (
                  <Card 
                    key={image.key} 
                    className="cursor-pointer hover:ring-2 hover:ring-primary transition-all overflow-hidden"
                    onClick={() => {
                      setSelectedPetcamImage(image)
                      setPetcamDetailOpen(true)
                    }}
                  >
                    <div className="aspect-square relative">
                      <img 
                        src={image.url} 
                        alt={image.petName}
                        className="w-full h-full object-cover"
                      />
                      {image.fgsScore !== undefined && (
                        <div className={`absolute top-2 right-2 px-2 py-1 rounded text-xs font-bold ${
                          image.fgsScore <= 2 ? 'bg-green-500 text-white' :
                          image.fgsScore <= 4 ? 'bg-amber-500 text-white' :
                          'bg-red-500 text-white'
                        }`}>
                          FGS {image.fgsScore}
                        </div>
                      )}
                    </div>
                    <CardContent className="p-3">
                      <p className="font-medium text-sm truncate">{image.petName}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(image.lastModified).toLocaleString("ko-KR")}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* 펫캠 이미지 상세 Dialog */}
            <Dialog open={petcamDetailOpen} onOpenChange={setPetcamDetailOpen}>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>펫캠 이미지 상세</DialogTitle>
                  <DialogDescription>
                    {selectedPetcamImage?.petName}의 펫캠 이미지입니다.
                  </DialogDescription>
                </DialogHeader>
                {selectedPetcamImage && (
                  <div className="space-y-4">
                    <div className="aspect-video relative rounded-lg overflow-hidden bg-muted">
                      <img 
                        src={selectedPetcamImage.url} 
                        alt={selectedPetcamImage.petName}
                        className="w-full h-full object-contain"
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-3 bg-muted rounded-lg">
                        <p className="text-xs text-muted-foreground">고양이</p>
                        <p className="font-medium">{selectedPetcamImage.petName}</p>
                      </div>
                      <div className="p-3 bg-muted rounded-lg">
                        <p className="text-xs text-muted-foreground">촬영 시간</p>
                        <p className="font-medium">
                          {new Date(selectedPetcamImage.lastModified).toLocaleString("ko-KR")}
                        </p>
                      </div>
                      {selectedPetcamImage.fgsScore !== undefined && (
                        <>
                          <div className="p-3 bg-muted rounded-lg">
                            <p className="text-xs text-muted-foreground">FGS 점수</p>
                            <p className={`font-bold text-lg ${
                              selectedPetcamImage.fgsScore <= 2 ? 'text-green-600' :
                              selectedPetcamImage.fgsScore <= 4 ? 'text-amber-600' :
                              'text-red-600'
                            }`}>
                              {selectedPetcamImage.fgsScore}점
                            </p>
                          </div>
                          <div className="p-3 bg-muted rounded-lg">
                            <p className="text-xs text-muted-foreground">상태</p>
                            <p className="font-medium">
                              {selectedPetcamImage.fgsScore <= 2 ? '😊 편안함' :
                               selectedPetcamImage.fgsScore <= 4 ? '😐 보통' :
                               '😣 불편함'}
                            </p>
                          </div>
                        </>
                      )}
                    </div>

                    {selectedPetcamImage.fgsExplanation && (
                      <div className="p-4 bg-muted rounded-lg">
                        <p className="text-xs text-muted-foreground mb-2">AI 분석 결과</p>
                        <p className="text-sm">{selectedPetcamImage.fgsExplanation}</p>
                      </div>
                    )}

                    <div className="p-3 bg-muted rounded-lg">
                      <p className="text-xs text-muted-foreground mb-1">파일 경로</p>
                      <p className="text-xs font-mono break-all">{selectedPetcamImage.key}</p>
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
