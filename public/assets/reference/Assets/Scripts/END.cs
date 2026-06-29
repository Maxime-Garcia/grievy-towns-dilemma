using System.Collections;
using System.Collections.Generic;
using UnityEngine;

public class END : MonoBehaviour
{
    public bool hasSpeakWithFire;
    public bool hasSpeakWithSwamp;
    public bool hasSpeakWithAir;
    public bool hasSpeakWithSea;
    // Start is called before the first frame update
    void Start()
    {

    }

    // Update is called once per frame
    void Update()
    {
        if(hasSpeakWithSea && hasSpeakWithFire && hasSpeakWithAir && hasSpeakWithSwamp){

        }
    }
}
