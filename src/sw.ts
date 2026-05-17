/// <reference lib="webworker" />
import { cleanupOutdatedCaches, precacheAndRoute } from 'workbox-precaching'

declare const self: ServiceWorkerGlobalScope & {
    __WB_MANIFEST: any
}

precacheAndRoute(self.__WB_MANIFEST)
cleanupOutdatedCaches()

// 푸시 알림 수신
self.addEventListener('push', (event) => {
    const data = event.data?.json() ?? {}

    event.waitUntil(
        self.registration.showNotification(data.title ?? '알림', {
            body: data.body ?? '',
            icon: '/icon-192.png',
        })
    )
})

// 알림 클릭 시 앱 열기
self.addEventListener('notificationclick', (event) => {
    event.notification.close()
    event.waitUntil(
        self.clients.openWindow('/')
    )
})