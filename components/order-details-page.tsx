"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/router"
import { Box, Heading, Text, List, ListItem, Divider, Button, useToast, Spinner } from "@chakra-ui/react"
import { getOrderById } from "@/lib/order-service"
import type { Order } from "@/types/order"
import { orderActivityService } from "@/lib/order-activity-service"

const OrderDetailsPage = () => {
  const router = useRouter()
  const { orderId } = router.query
  const [order, setOrder] = useState<Order | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const toast = useToast()

  useEffect(() => {
    const fetchOrder = async () => {
      if (orderId) {
        try {
          const fetchedOrder = await getOrderById(orderId as string)
          setOrder(fetchedOrder)
        } catch (error) {
          toast({
            title: "Error fetching order",
            description: "Failed to retrieve order details.",
            status: "error",
            duration: 5000,
            isClosable: true,
          })
        } finally {
          setIsLoading(false)
        }
      }
    }

    fetchOrder()
  }, [orderId, toast])

  const handleMarkAsShipped = async () => {
    if (order) {
      try {
        // Simulate shipping process
        await new Promise((resolve) => setTimeout(resolve, 1000))

        // Update order status (in a real app, this would be an API call)
        const updatedOrder = { ...order, status: "shipped" }
        setOrder(updatedOrder)

        // Add order activity
        await orderActivityService.createActivity({
          orderId: order.id,
          activityType: "status_update",
          description: "Order marked as shipped",
        })

        toast({
          title: "Order Shipped",
          description: "Order status updated to shipped.",
          status: "success",
          duration: 5000,
          isClosable: true,
        })
      } catch (error) {
        toast({
          title: "Error updating order",
          description: "Failed to update order status.",
          status: "error",
          duration: 5000,
          isClosable: true,
        })
      }
    }
  }

  if (isLoading) {
    return (
      <Box textAlign="center" mt={10}>
        <Spinner size="xl" />
        <Text mt={2}>Loading order details...</Text>
      </Box>
    )
  }

  if (!order) {
    return (
      <Box textAlign="center" mt={10}>
        <Text>Order not found.</Text>
      </Box>
    )
  }

  return (
    <Box p={5} maxW="xl" mx="auto">
      <Heading as="h1" size="xl" mb={5}>
        Order Details
      </Heading>
      <Text fontWeight="bold">Order ID: {order.id}</Text>
      <Text>Status: {order.status}</Text>
      <Text>Customer: {order.customerName}</Text>
      <Text>Email: {order.customerEmail}</Text>

      <Divider my={4} />

      <Heading as="h2" size="lg" mt={4} mb={2}>
        Order Items
      </Heading>
      <List spacing={3}>
        {order.items.map((item) => (
          <ListItem key={item.id}>
            {item.name} - Quantity: {item.quantity} - Price: ${item.price}
          </ListItem>
        ))}
      </List>

      <Divider my={4} />

      <Text fontWeight="bold">Total: ${order.totalAmount}</Text>

      <Button colorScheme="blue" mt={5} onClick={handleMarkAsShipped} isDisabled={order.status === "shipped"}>
        Mark as Shipped
      </Button>
    </Box>
  )
}

export default OrderDetailsPage
