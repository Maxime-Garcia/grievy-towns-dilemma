using System.Collections;
using System.Collections.Generic;
using UnityEngine;

public class activateBoxTp : MonoBehaviour
{
    public GameObject Player;
    public int stepActivation;
    // Start is called before the first frame update
    void Start()
    {
        gameObject.SetActive(false);
        Player = GameObject.FindGameObjectWithTag("Player");
        if (Player.GetComponent<PlayerController>().houxStep >= stepActivation)
            gameObject.SetActive(true);
    }   
}
