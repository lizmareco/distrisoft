"use client"

import { AppBar, Toolbar, Typography, Box, Container } from "@mui/material"
import Image from "next/image"
import Link from "next/link"

export default function AuthNavbar() {
  return (
    <AppBar position="static" color="transparent" elevation={0} sx={{ bgcolor: "white" }}>
      <Container maxWidth="lg">
        <Toolbar sx={{ justifyContent: "space-between" }}>
          <Box sx={{ display: "flex", alignItems: "center" }}>
            <Link href="/" passHref style={{ display: "flex", alignItems: "center", textDecoration: "none" }}>
            </Link>
          </Box>
        </Toolbar>
      </Container>
    </AppBar>
  )
}

