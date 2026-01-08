"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useState, type ChangeEvent } from "react"
import { Bell, KeyRound, Trash2, User } from "lucide-react"
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { useAuth } from "@/contexts/auth-context"

export default function UserProfileEditPage() {
  const router = useRouter()
  const { user, updateUser, accessToken, clearLocalAuth } = useAuth()
  const [name, setName] = useState("")
  const [address, setAddress] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null)
  const [notificationsEnabled, setNotificationsEnabled] = useState(true)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [deleteStep, setDeleteStep] = useState<"confirm" | "final">("confirm")
  const [isPasswordOpen, setIsPasswordOpen] = useState(false)
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [passwordMessage, setPasswordMessage] = useState<string | null>(null)
  const [isChangingPassword, setIsChangingPassword] = useState(false)

  useEffect(() => {
    setName(user?.name ?? "")
    setAddress(user?.address ?? "")
    setEmail(user?.email ?? "")
    setPhone(user?.phone ?? "")
    setProfilePhoto(user?.profilePhoto ?? null)
    setNotificationsEnabled(user?.notificationsEnabled ?? true)
  }, [user])

  const handlePhotoChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) {
      setProfilePhoto(null)
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setProfilePhoto(reader.result)
      }
    }
    reader.readAsDataURL(file)
  }

  const handleSave = () => {
    if (!user) return
    updateUser({
      name: name.trim() || user.name,
      address: address.trim() || undefined,
      phone: phone.trim() || undefined,
      profilePhoto: profilePhoto || undefined,
    })
    router.push("/settings")
  }

  const handleNotificationsToggle = (enabled: boolean) => {
    if (!user) return
    setNotificationsEnabled(enabled)
    updateUser({ notificationsEnabled: enabled })
  }

  const handleChangePassword = async () => {
    if (!accessToken) {
      setPasswordError("로그인이 필요합니다.")
      return
    }

    if (!currentPassword || !newPassword) {
      setPasswordError("현재 비밀번호와 새 비밀번호를 입력해주세요.")
      return
    }

    if (newPassword !== confirmPassword) {
      setPasswordError("새 비밀번호가 서로 달라요.")
      return
    }

    setIsChangingPassword(true)
    setPasswordError(null)
    setPasswordMessage(null)

    try {
      const response = await fetch("/api/account/change-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      })

      if (!response.ok) {
        const data = await response.json().catch(() => null)
        const message = data?.message ?? "비밀번호 변경에 실패했습니다."
        throw new Error(message)
      }

      setIsPasswordOpen(false)
      setPasswordMessage("비밀번호가 변경되었습니다.")
      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")
    } catch (error) {
      const message = error instanceof Error ? error.message : "비밀번호 변경에 실패했습니다."
      setPasswordError(message)
    } finally {
      setIsChangingPassword(false)
    }
  }

  const handleDelete = async () => {
    if (!accessToken) {
      setDeleteError("로그인이 필요합니다.")
      return
    }

    setIsDeleting(true)
    setDeleteError(null)

    try {
      const response = await fetch("/api/account/delete", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      })

      if (!response.ok) {
        const data = await response.json().catch(() => null)
        const message = data?.message ?? "계정 삭제에 실패했습니다."
        throw new Error(message)
      }

      clearLocalAuth()
      setIsDeleteOpen(false)
      router.replace("/auth/sign-in")
    } catch (error) {
      const message = error instanceof Error ? error.message : "계정 삭제에 실패했습니다."
      setDeleteError(message)
    } finally {
      setIsDeleting(false)
    }
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-6">
        <div className="text-center space-y-3">
          <p className="text-sm text-muted-foreground">로그인이 필요합니다.</p>
          <Button asChild>
            <Link href="/auth/sign-in">로그인하기</Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <main className="px-6 pt-safe-top pt-6 pb-24 space-y-4">
        <h1 className="text-xl font-bold text-foreground">사용자 프로필 편집</h1>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">기본 정보</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center overflow-hidden">
                {profilePhoto ? (
                  <img src={profilePhoto} alt="집사님 프로필" className="h-full w-full object-cover" />
                ) : (
                  <User className="w-8 h-8 text-muted-foreground" />
                )}
              </div>
              <div className="flex-1 space-y-2">
                <Label htmlFor="profilePhoto">프로필 사진</Label>
                <Input id="profilePhoto" type="file" accept="image/*" onChange={handlePhotoChange} />
                {profilePhoto && (
                  <Button type="button" variant="ghost" size="sm" className="px-0" onClick={() => setProfilePhoto(null)}>
                    사진 삭제
                  </Button>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">이름</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="집사님" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">주소</Label>
              <Input
                id="address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="주소를 입력하세요"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">이메일</Label>
              <Input id="email" value={email} disabled />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">연락처</Label>
              <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="010-0000-0000" />
            </div>

            <Button className="w-full" onClick={handleSave}>
              저장
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">계정 관리</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Card className="hover:bg-muted/50 transition-colors">
              <CardContent className="py-0.5 px-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center">
                      <Bell className="w-3 h-3 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">이상 신호 알림 받기</p>
                    </div>
                  </div>
                  <Switch
                    checked={notificationsEnabled}
                    onCheckedChange={handleNotificationsToggle}
                    aria-label="이상 신호 알림 받기"
                  />
                </div>
              </CardContent>
            </Card>
            <Dialog
              open={isPasswordOpen}
              onOpenChange={(open) => {
                setIsPasswordOpen(open)
                if (!open) {
                  setPasswordError(null)
                  setIsChangingPassword(false)
                  setCurrentPassword("")
                  setNewPassword("")
                  setConfirmPassword("")
                }
              }}
            >
              <button
                type="button"
                className="w-full text-left"
                onClick={() => {
                  setPasswordError(null)
                  setPasswordMessage(null)
                  setIsPasswordOpen(true)
                }}
              >
                <Card className="hover:bg-muted/50 transition-colors">
                  <CardContent className="py-0.5 px-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center">
                          <KeyRound className="w-3 h-3 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="font-medium text-sm">비밀번호 변경</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </button>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>비밀번호 변경</DialogTitle>
                  <DialogDescription>현재 비밀번호를 확인한 뒤 새 비밀번호로 변경합니다.</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="currentPassword">현재 비밀번호</Label>
                    <Input
                      id="currentPassword"
                      type="password"
                      autoComplete="current-password"
                      value={currentPassword}
                      onChange={(event) => setCurrentPassword(event.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="newPassword">새 비밀번호</Label>
                    <Input
                      id="newPassword"
                      type="password"
                      autoComplete="new-password"
                      value={newPassword}
                      onChange={(event) => setNewPassword(event.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">새 비밀번호 확인</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      autoComplete="new-password"
                      value={confirmPassword}
                      onChange={(event) => setConfirmPassword(event.target.value)}
                    />
                  </div>
                  {passwordError && <p className="text-xs text-red-600">{passwordError}</p>}
                </div>
                <DialogFooter>
                  <DialogClose asChild>
                    <Button type="button" variant="outline" disabled={isChangingPassword}>
                      취소
                    </Button>
                  </DialogClose>
                  <Button type="button" onClick={handleChangePassword} disabled={isChangingPassword}>
                    {isChangingPassword ? "변경 중..." : "변경"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            <AlertDialog
              open={isDeleteOpen}
              onOpenChange={(open) => {
                setIsDeleteOpen(open)
                if (!open) {
                  setDeleteStep("confirm")
                  setDeleteError(null)
                  setIsDeleting(false)
                }
              }}
            >
              <button
                type="button"
                className="w-full text-left"
                onClick={() => {
                  setDeleteError(null)
                  setDeleteStep("confirm")
                  setIsDeleteOpen(true)
                }}
              >
                <Card className="hover:bg-muted/50 transition-colors">
                  <CardContent className="py-0.5 px-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center">
                          <Trash2 className="w-3 h-3 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="font-medium text-sm">계정 삭제</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </button>
              <AlertDialogContent>
                {deleteStep === "confirm" ? (
                  <>
                    <AlertDialogHeader>
                      <AlertDialogTitle>계정 삭제를 시작할까요?</AlertDialogTitle>
                      <AlertDialogDescription>
                        삭제 후에는 복구할 수 없습니다.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel disabled={isDeleting}>취소</AlertDialogCancel>
                      <Button type="button" onClick={() => setDeleteStep("final")} disabled={isDeleting}>
                        계속
                      </Button>
                    </AlertDialogFooter>
                  </>
                ) : (
                  <>
                    <AlertDialogHeader>
                      <AlertDialogTitle>정말로 계정을 삭제할까요?</AlertDialogTitle>
                      <AlertDialogDescription>삭제 후에는 복구할 수 없습니다.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel disabled={isDeleting}>취소</AlertDialogCancel>
                      <Button
                        type="button"
                        variant="destructive"
                        onClick={handleDelete}
                        disabled={isDeleting}
                      >
                        {isDeleting ? "삭제 중..." : "삭제"}
                      </Button>
                    </AlertDialogFooter>
                  </>
                )}
              </AlertDialogContent>
            </AlertDialog>
            {passwordMessage && <p className="text-xs text-emerald-600">{passwordMessage}</p>}
            {deleteError && <p className="text-xs text-red-600">{deleteError}</p>}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
