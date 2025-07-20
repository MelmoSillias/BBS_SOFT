<?php

namespace App\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;

final class TransfertController extends AbstractController
{
    #[Route('/transfert', name: 'app_transfert')]
    public function index(): Response
    {
        return $this->render('transfert/index.html.twig', [
            'controller_name' => 'TransfertController',
        ]);
    }
}
