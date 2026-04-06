import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './ui/card';
import { QrCode, Hash, Package } from 'lucide-react';
import { Textarea } from './ui/textarea';

export function DeviceRegistration() {
  const navigate = useNavigate();
  const [serialNumber, setSerialNumber] = useState('');
  const [deviceModel, setDeviceModel] = useState('');
  const [activationCode, setActivationCode] = useState('');
  const [description, setDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // 기기 등록 로직 시뮬레이션
    setTimeout(() => {
      console.log('기기 등록:', { serialNumber, deviceModel, activationCode, description });
      setIsLoading(false);
      alert('기기가 성공적으로 등록되었습니다!');
    }, 1500);
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl">기기 등록</CardTitle>
        <CardDescription>
          새로운 기기를 등록하여 시스템에 연결하세요
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="serialNumber">시리얼 번호</Label>
              <div className="relative">
                <Hash className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                  id="serialNumber"
                  type="text"
                  placeholder="SN-XXXX-XXXX-XXXX"
                  value={serialNumber}
                  onChange={(e) => setSerialNumber(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
              <p className="text-xs text-muted-foreground">
                기기 뒷면에 표시된 시리얼 번호를 입력하세요
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="deviceModel">기기 모델명</Label>
              <div className="relative">
                <Package className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                  id="deviceModel"
                  type="text"
                  placeholder="예: Model-X Pro"
                  value={deviceModel}
                  onChange={(e) => setDeviceModel(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="activationCode">활성화 코드</Label>
              <div className="relative">
                <QrCode className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                  id="activationCode"
                  type="text"
                  placeholder="XXXX-XXXX-XXXX-XXXX"
                  value={activationCode}
                  onChange={(e) => setActivationCode(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
              <p className="text-xs text-muted-foreground">
                제품 패키지에 포함된 활성화 코드를 입력하세요
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">기기 설명 (선택)</Label>
              <Textarea
                id="description"
                placeholder="기기 설치 위치나 용도를 입력하세요"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
            </div>
          </div>

          <Button
            type="submit"
            className="w-full mt-6"
            disabled={isLoading}
          >
            {isLoading ? '등록 중...' : '기기 등록'}
          </Button>
        </form>
      </CardContent>
      <CardFooter className="flex justify-center">
        <button
          type="button"
          className="text-sm text-muted-foreground hover:text-foreground"
          onClick={() => navigate('/plant-selection')}
        >
          나중에 등록하기
        </button>
      </CardFooter>
    </Card>
  );
}